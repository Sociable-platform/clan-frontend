import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import { TEAM_MESSAGES } from '../../config/teamConfig';

/** Asks before removing. `member` is who is being removed, or null while the dialog is closed. */
export function RemoveMemberDialog({ member, isPending, errorMessage = null, onCancel, onConfirm }) {
  const label = member ? member.name || member.email : '';
  return (
    <ConfirmDialog
      open={member !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      title={TEAM_MESSAGES.REMOVE_TITLE}
      description={`${label} loses access to this game at once: its widget, its team and, for an owner, its API keys. You can invite them again later.`}
      confirmLabel={TEAM_MESSAGES.REMOVE_CONFIRM}
      isPending={isPending}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
