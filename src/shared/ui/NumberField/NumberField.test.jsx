import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NumberField } from './NumberField';

function renderField(props = {}) {
  const onValueChange = vi.fn();
  render(<NumberField label="Max members" value={30} min={2} max={200} onValueChange={onValueChange} {...props} />);
  return { onValueChange, input: screen.getByLabelText('Max members') };
}

describe('NumberField', () => {
  it('passes on a typed number, even outside the range, so the server can judge it', async () => {
    const { input, onValueChange } = renderField();

    await userEvent.setup().clear(input);
    await userEvent.setup().type(input, '500');

    expect(onValueChange).toHaveBeenLastCalledWith(500);
  });

  it('passes on nothing while the box is empty and restores the value on blur', async () => {
    const user = userEvent.setup();
    const { input, onValueChange } = renderField();

    await user.clear(input);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue(null);

    await user.tab();
    expect(input).toHaveValue(30);
  });

  it('describes the input with its error', () => {
    renderField({ error: 'must be at most 200' });

    expect(screen.getByLabelText('Max members')).toHaveAccessibleDescription('must be at most 200');
    expect(screen.getByLabelText('Max members')).toBeInvalid();
  });
});
