import { useMutation, useQueryClient } from '@tanstack/react-query';

import { declineInvitation } from '../api/invitationsApi';
import { INVITATIONS_QUERY_KEYS } from '../config/invitationsQueryKeys';

/** Declines an invitation: it is deleted and nothing else happens. The list refreshes whatever the answer. */
export function useDeclineInvitationMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (inviteId) => declineInvitation({ inviteId }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEYS.all }),
  });

  return {
    declineInvitation: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
