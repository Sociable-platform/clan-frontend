import { cleanup, render, screen } from '@testing-library/react';
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

  it('steps by `step` with the buttons', async () => {
    const { onValueChange } = renderField({ step: 5 });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Increase Max members' }));
    await user.click(screen.getByRole('button', { name: 'Decrease Max members' }));

    expect(onValueChange).toHaveBeenNthCalledWith(1, 35);
    expect(onValueChange).toHaveBeenNthCalledWith(2, 25);
  });

  it('keeps the buttons inside min and max, even from a value that is outside them', async () => {
    const user = userEvent.setup();
    const high = renderField({ value: 198, step: 5 });
    await user.click(screen.getByRole('button', { name: 'Increase Max members' }));
    expect(high.onValueChange).toHaveBeenCalledWith(200);
    cleanup();

    const outside = renderField({ value: 500, step: 5 });
    await user.click(screen.getByRole('button', { name: 'Decrease Max members' }));
    expect(outside.onValueChange).toHaveBeenCalledWith(200);
    cleanup();

    const low = renderField({ value: 3, step: 5 });
    await user.click(screen.getByRole('button', { name: 'Decrease Max members' }));
    expect(low.onValueChange).toHaveBeenCalledWith(2);
  });
});
