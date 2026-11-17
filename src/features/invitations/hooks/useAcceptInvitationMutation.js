import { useMutation, useQueryClient } from '@tanstack/react-query';

import { acceptInvitation } from '../api/invitationsApi';
import { INVITATIONS_QUERY_KEYS } from '../config/invitationsQueryKeys';

/**
 * Accepts an invitation. The list refreshes whatever the answer, so one that was cancelled or expired
 * disappears too. The page refreshes the games list (there is a new game in it).
 */
export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (inviteId) => acceptInvitation({ inviteId }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEYS.all }),
  });

  return {
    acceptInvitation: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
