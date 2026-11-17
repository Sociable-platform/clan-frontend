import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelInvite } from '../api/teamApi';
import { TEAM_QUERY_KEYS } from '../config/teamQueryKeys';

/** Takes an invitation back. The list refreshes whatever the answer, so one that is gone already disappears too. */
export function useCancelInviteMutation(gameId) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (inviteId) => cancelInvite({ gameId, inviteId }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEYS.invites(gameId) }),
  });

  return {
    cancelInvite: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
