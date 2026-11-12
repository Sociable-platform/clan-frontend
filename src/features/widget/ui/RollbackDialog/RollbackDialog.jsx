import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import { WIDGET_MESSAGES } from '../../config/widgetConfig';

/** Asks before rolling back. `version` is the one to roll back to, or null while the dialog is closed. */
export function RollbackDialog({ version, newVersionNumber, isPending, errorMessage, onCancel, onConfirm }) {
  return (
    <ConfirmDialog
      open={version !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      title={version ? `Roll back to version ${version.version}?` : ''}
      description={
        version
          ? `Version ${version.version} is published again as version ${newVersionNumber}, on top of the history, and becomes the version players load. Nothing is deleted, and your draft is not changed.`
          : ''
      }
      confirmLabel={WIDGET_MESSAGES.ROLLBACK_CONFIRM}
      confirmTone="primary"
      isPending={isPending}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
