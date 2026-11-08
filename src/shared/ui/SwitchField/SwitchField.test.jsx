import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SwitchField } from './SwitchField';

describe('SwitchField', () => {
  it('is a switch that reports the new state', async () => {
    const onCheckedChange = vi.fn();
    render(<SwitchField label="Profanity filter" description="Banned words become ***" checked={false} onCheckedChange={onCheckedChange} />);

    const control = screen.getByRole('switch', { name: 'Profanity filter' });
    expect(control).not.toBeChecked();
    expect(control).toHaveAccessibleDescription('Banned words become ***');
    await userEvent.setup().click(control);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
