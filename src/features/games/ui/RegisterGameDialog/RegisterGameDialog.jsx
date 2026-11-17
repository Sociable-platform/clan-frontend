import * as Dialog from '@radix-ui/react-dialog';
import { useLayoutEffect, useRef } from 'react';

import { GAMES_MESSAGES } from '../../config/gamesConfig';
import { RegisterGameForm } from '../RegisterGameForm';

/**
 * "Register existing game" as a modal dialog. Radix handles the focus trap, Escape and a click
 * outside; focus starts in the first field and goes back to the button that opened the dialog
 * (Radix only does that for its own Trigger, and this dialog is controlled). `form` is what
 * useRegisterGameForm returns.
 */
export function RegisterGameDialog({ open, form, readOnlyMessage = null, onClose }) {
  const returnFocusRef = useRef(null);

  // A layout effect, so it reads the focused element before Radix moves focus into the dialog.
  useLayoutEffect(() => {
    if (open) returnFocusRef.current = document.activeElement;
  }, [open]);

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) onClose();
  };

  const handleCloseAutoFocus = (event) => {
    event.preventDefault();
    returnFocusRef.current?.focus();
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog" onCloseAutoFocus={handleCloseAutoFocus}>
          <Dialog.Title className="dialog-title">{GAMES_MESSAGES.REGISTER_HEADING}</Dialog.Title>
          <Dialog.Description className="dialog-description">{GAMES_MESSAGES.REGISTER_DESCRIPTION}</Dialog.Description>
          <RegisterGameForm
            values={form.values}
            fieldErrors={form.fieldErrors}
            formError={form.formError}
            isPending={form.isPending}
            readOnlyMessage={readOnlyMessage}
            onChange={form.handleChange}
            onSubmit={form.handleSubmit}
            onCancel={onClose}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
