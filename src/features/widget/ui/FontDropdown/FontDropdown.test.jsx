import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FontDropdown } from './FontDropdown';

function Harness({ onValueChange = () => {} }) {
  const [value, setValue] = useState('Inter');
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <FontDropdown
        label="Headings"
        value={value}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onValueChange={(family) => {
          setValue(family);
          onValueChange(family);
        }}
      />
      <button type="button">Somewhere else</button>
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: /^Headings/ });
const search = () => screen.getByRole('searchbox', { name: 'Search fonts for headings' });

describe('FontDropdown', () => {
  it('is one line with the current font while closed', () => {
    render(<Harness />);

    expect(trigger()).toHaveTextContent('Inter');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('opens with the search box focused and every font listed', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger());

    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(search()).toHaveFocus();
    expect(screen.getByText('43 fonts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Inter/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('chooses a font, closes and gives focus back to the line', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);

    await user.click(trigger());
    await user.type(search(), 'orbit');
    expect(screen.getByText('1 fonts')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Orbitron/ }));

    expect(onValueChange).toHaveBeenCalledWith('Orbitron');
    expect(trigger()).toHaveTextContent('Orbitron');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveFocus();
  });

  it('finds a category by its name and says when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger());
    expect(screen.queryByRole('button', { name: 'Pixel' })).not.toBeInTheDocument();
    await user.type(search(), 'pixel');
    expect(screen.getByText('4 fonts')).toBeInTheDocument();

    await user.clear(search());
    await user.type(search(), 'zzz');
    expect(screen.getByText('No font matches that search.')).toBeInTheDocument();
  });

  it('works from the keyboard: arrows move through the list, Enter chooses', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger());
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /^Inter/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /^Roboto/ })).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(search()).toHaveFocus();

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(trigger()).toHaveTextContent('Roboto');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape without changing the font, and starts the search over next time', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger());
    await user.type(search(), 'orbit');
    await user.keyboard('{Escape}');

    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveTextContent('Inter');
    expect(trigger()).toHaveFocus();

    await user.click(trigger());
    expect(search()).toHaveValue('');
  });

  it('closes when something else on the page is clicked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'Somewhere else' }));

    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });
});
