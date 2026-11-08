import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CardChoiceField } from './CardChoiceField';

const OPTIONS = [
  { value: 'bubbles', label: 'Bubbles', description: 'Messenger style', preview: <i data-testid="art" /> },
  { value: 'log', label: 'Log' },
];

describe('CardChoiceField', () => {
  it('marks the current card and reports a new pick', async () => {
    const onValueChange = vi.fn();
    render(<CardChoiceField legend="Chat layout" value="bubbles" options={OPTIONS} onValueChange={onValueChange} />);

    expect(screen.getByRole('radio', { name: 'Bubbles' })).toBeChecked();
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Log' }));

    expect(onValueChange).toHaveBeenCalledWith('log');
    expect(screen.getByRole('group', { name: 'Chat layout' })).toBeInTheDocument();
  });

  it('names a card by its label only and gives the description separately', () => {
    render(<CardChoiceField legend="Chat layout" value="bubbles" options={OPTIONS} onValueChange={() => {}} />);

    const radio = screen.getByRole('radio', { name: 'Bubbles' });
    expect(radio).toHaveAccessibleDescription('Messenger style');
  });

  it('hides the picture from screen readers', () => {
    render(<CardChoiceField legend="Chat layout" value="bubbles" options={OPTIONS} onValueChange={() => {}} />);

    expect(screen.getByTestId('art').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('shows an error under the group', () => {
    render(<CardChoiceField legend="Chat layout" value="bubbles" options={OPTIONS} onValueChange={() => {}} error="Pick one" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Pick one');
  });
});
