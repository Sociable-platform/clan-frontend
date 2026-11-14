import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useLayoutEffect, useRef } from 'react';

/**
 * Modal confirmation for destructive actions. Radix handles the focus trap, Escape and
 * returning focus to whatever had it when the dialog opened (usually the button that opened it;
 * Radix only does this for its own Trigger, and this dialog is controlled). Focus starts on Cancel, so Enter never confirms by accident.
 * `confirmTone` is 'danger' (red, for things that cannot be undone) or 'primary'. Confirm is a plain button (not `AlertDialog.Action`) so the dialog stays open while the
 * request runs and the caller closes it on success.
 * `children` (optional) are form fields shown between the description and the buttons;
 * `confirmDisabled` keeps Confirm off until they are valid. `onOpenAutoFocus` replaces the default
 * "focus Cancel" (call `event.preventDefault()` and focus a field yourself).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmTone = 'danger',
  cancelLabel = 'Cancel',
  isPending = false,
  errorMessage = null,
  confirmDisabled = false,
  onOpenAutoFocus = undefined,
  children = null,
  onConfirm,
}) {
  const returnFocusRef = useRef(null);

  // A layout effect, so it reads the focused element before Radix moves focus into the dialog.
  useLayoutEffect(() => {
    if (open) returnFocusRef.current = document.activeElement;
  }, [open]);

  const handleCloseAutoFocus = (event) => {
    event.preventDefault();
    returnFocusRef.current?.focus();
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content
          className="dialog"
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          <AlertDialog.Title className="dialog-title">{title}</AlertDialog.Title>
          <AlertDialog.Description className="dialog-description">{description}</AlertDialog.Description>
          {children}
          {errorMessage ? (
            <p role="alert" className="form-alert form-alert-error">
              {errorMessage}
            </p>
          ) : null}
          <div className="dialog-actions">
            <AlertDialog.Cancel className="button button-secondary" disabled={isPending}>
              {cancelLabel}
            </AlertDialog.Cancel>
            <button
              type="button"
              className={confirmTone === 'danger' ? 'button button-danger' : 'button'}
              disabled={isPending || confirmDisabled}
              onClick={onConfirm}
            >
              {isPending ? 'Working…' : confirmLabel}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
