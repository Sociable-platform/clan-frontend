import { useAuthStore } from '@/store';

import { SUSPENSION_MESSAGES } from '../config/suspension';

/**
 * Whether the signed-in developer may change data. A suspended account is read-only: `readOnlyMessage`
 * is the sentence to show next to a control that is turned off, and null while the account is active
 * (and for an admin, who has no developer account). Pages read this and pass it down as props.
 */
export function useAccountAccess() {
  const developer = useAuthStore((state) => state.developer);
  const isSuspended = developer?.isSuspended === true;

  return {
    isSuspended,
    statusReason: isSuspended ? developer.statusReason : null,
    readOnlyMessage: isSuspended ? SUSPENSION_MESSAGES.READ_ONLY : null,
  };
}
