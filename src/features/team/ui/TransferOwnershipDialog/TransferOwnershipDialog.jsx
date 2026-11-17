import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import { TEAM_MESSAGES } from '../../config/teamConfig';

/** Asks before handing the game over. `member` is the new owner, or null while the dialog is closed. */
export function TransferOwnershipDialog({ member, gameName, isPending, errorMessage = null, onCancel, onConfirm }) {
  const label = member ? member.name || member.email : '';
  return (
    <ConfirmDialog
      open={member !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      title={TEAM_MESSAGES.TRANSFER_TITLE}
      description={`${label} becomes the owner of ${gameName}, and you become a member: you keep editing the widget, but you can no longer manage its API keys or its team. Only the new owner can undo this.`}
      confirmLabel={TEAM_MESSAGES.TRANSFER_CONFIRM}
      confirmTone="primary"
      isPending={isPending}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
