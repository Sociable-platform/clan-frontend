import { useMutation, useQueryClient } from '@tanstack/react-query';

import { inviteToGame } from '../api/teamApi';
import { TEAM_QUERY_KEYS } from '../config/teamQueryKeys';

/** Sends an invitation and refreshes the pending list. Inviting an address again renews its invitation. */
export function useInviteToGameMutation(gameId) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (email) => inviteToGame({ gameId, email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEYS.invites(gameId) }),
  });

  return { inviteToGame: mutation.mutateAsync, isPending: mutation.isPending };
}
