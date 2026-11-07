import * as AlertDialog from '@radix-ui/react-alert-dialog';

/**
 * Modal confirmation for destructive actions. Radix handles the focus trap, Escape and
 * returning focus to the trigger. Focus starts on Cancel, so Enter never confirms by accident.
 * Confirm is a plain button (not `AlertDialog.Action`) so the dialog stays open while the
 * request runs and the caller closes it on success.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  isPending = false,
  errorMessage = null,
  onConfirm,
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog">
          <AlertDialog.Title className="dialog-title">{title}</AlertDialog.Title>
          <AlertDialog.Description className="dialog-description">{description}</AlertDialog.Description>
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
              className="button button-danger"
              disabled={isPending}
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
