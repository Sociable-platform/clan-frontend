import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ColorField } from './ColorField';

function renderField(props = {}) {
  const onValueChange = vi.fn();
  render(<ColorField label="Brand" value="#80EAFF" onValueChange={onValueChange} {...props} />);
  return { onValueChange, input: screen.getByLabelText('Brand') };
}

describe('ColorField', () => {
  it('passes on a complete hex in uppercase', async () => {
    const { input, onValueChange } = renderField();

    await userEvent.setup().clear(input);
    await userEvent.setup().type(input, '#2e8b57');

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('#2E8B57');
  });

  it('shows a hint and changes nothing while the hex is incomplete', async () => {
    const user = userEvent.setup();
    const { input, onValueChange } = renderField();

    await user.clear(input);
    await user.type(input, '#2E8');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Use a color like #80EAFF');
  });

  it('restores the last good colour on blur', async () => {
    const user = userEvent.setup();
    const { input } = renderField();

    await user.clear(input);
    await user.type(input, '#2E8');
    await user.tab();

    expect(input).toHaveValue('#80EAFF');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the server error when the draft is fine', () => {
    renderField({ error: 'Invalid format' });

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid format');
  });
});
