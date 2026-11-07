import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import { API_KEYS_MESSAGES } from '../../config/apiKeysConfig';

/** Asks before revoking. `apiKey` is the key being revoked, or null while the dialog is closed. */
export function RevokeApiKeyDialog({ apiKey, isPending, hasError, onCancel, onConfirm }) {
  return (
    <ConfirmDialog
      open={apiKey !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      title={API_KEYS_MESSAGES.REVOKE_TITLE}
      description={
        apiKey
          ? `Key ${apiKey.keyPrefix}… stops working immediately. Any game server using it will lose access. This cannot be undone.`
          : ''
      }
      confirmLabel={API_KEYS_MESSAGES.REVOKE_CONFIRM}
      isPending={isPending}
      errorMessage={hasError ? API_KEYS_MESSAGES.REVOKE_ERROR : null}
      onConfirm={onConfirm}
    />
  );
}
