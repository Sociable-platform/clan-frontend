import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SegmentedField } from './SegmentedField';

const OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

describe('SegmentedField', () => {
  it('marks the current option and reports a new pick', async () => {
    const onValueChange = vi.fn();
    render(<SegmentedField legend="Mode" value="dark" options={OPTIONS} onValueChange={onValueChange} />);

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Light' }));

    expect(onValueChange).toHaveBeenCalledWith('light');
    expect(screen.getByRole('group', { name: 'Mode' })).toBeInTheDocument();
  });
});
