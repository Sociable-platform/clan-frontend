import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { SelectField } from './SelectField';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

function Harness({ initial = '', placeholder = undefined }) {
  const [value, setValue] = useState(initial);
  return <SelectField label="Letter" value={value} onValueChange={setValue} options={OPTIONS} placeholder={placeholder} />;
}

describe('SelectField', () => {
  it('shows the placeholder, muted, while nothing is chosen, and never lists it as an option', async () => {
    const user = userEvent.setup();
    render(<Harness placeholder="Pick one" />);

    const button = screen.getByRole('button', { name: /Letter/ });
    expect(button).toHaveTextContent('Pick one');
    expect(button.querySelector('.field-select-placeholder')).not.toBeNull();
    expect(button).toHaveAttribute('data-value', '');

    await user.click(button);
    const options = within(await screen.findByRole('menu', { name: 'Letter' })).getAllByRole('menuitemradio');
    expect(options.map((option) => option.textContent)).toEqual(['Alpha', 'Beta']);
  });

  it('shows the chosen option instead of the placeholder, in the normal colour', async () => {
    const user = userEvent.setup();
    render(<Harness placeholder="Pick one" />);

    await user.click(screen.getByRole('button', { name: /Letter/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Beta' }));

    const button = screen.getByRole('button', { name: /Letter/ });
    expect(button).toHaveTextContent('Beta');
    expect(button).not.toHaveTextContent('Pick one');
    expect(button.querySelector('.field-select-placeholder')).toBeNull();
  });

  it('starts on an option when one is chosen already', () => {
    render(<Harness initial="a" placeholder="Pick one" />);

    expect(screen.getByRole('button', { name: /Letter/ })).toHaveTextContent('Alpha');
  });

  it('is unchanged without a placeholder: a value with no option shows the value', () => {
    render(<Harness initial="zzz" />);

    expect(screen.getByRole('button', { name: /Letter/ })).toHaveTextContent('zzz');
  });
});
