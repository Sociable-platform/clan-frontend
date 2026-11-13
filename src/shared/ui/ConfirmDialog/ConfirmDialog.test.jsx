import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from './ConfirmDialog';

function Harness({ confirmDisabled = false, onConfirm = vi.fn(), children = null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Sure?"
        description="This changes things."
        confirmLabel="Do it"
        confirmDisabled={confirmDisabled}
        onConfirm={onConfirm}
      >
        {children}
      </ConfirmDialog>
    </>
  );
}

describe('ConfirmDialog', () => {
  it('shows the children between the description and the buttons', async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <label>
          Reason
          <input />
        </label>
      </Harness>,
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(await screen.findByLabelText('Reason')).toBeInTheDocument();
  });

  it('keeps Confirm off while confirmDisabled is set', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness confirmDisabled onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(await screen.findByRole('button', { name: 'Do it' }));

    expect(screen.getByRole('button', { name: 'Do it' })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('starts on Cancel and gives focus back to the button that opened it', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });

    await user.click(opener);
    expect(await screen.findByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.keyboard('{Escape}');

    await waitFor(() => expect(opener).toHaveFocus());
  });
});
