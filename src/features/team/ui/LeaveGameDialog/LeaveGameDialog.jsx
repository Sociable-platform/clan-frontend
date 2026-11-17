import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import { TEAM_MESSAGES } from '../../config/teamConfig';

/** Asks before leaving. An owner can leave only while another owner is left; the server says so (last_owner). */
export function LeaveGameDialog({ open, gameName, isPending, errorMessage = null, onCancel, onConfirm }) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      title={TEAM_MESSAGES.LEAVE_TITLE}
      description={`You lose access to ${gameName} at once. An owner of the game can invite you again.`}
      confirmLabel={TEAM_MESSAGES.LEAVE_CONFIRM}
      isPending={isPending}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
