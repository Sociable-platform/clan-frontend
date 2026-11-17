import { useMutation, useQueryClient } from '@tanstack/react-query';

import { transferOwnership } from '../api/teamApi';
import { TEAM_QUERY_KEYS } from '../config/teamQueryKeys';

/**
 * Hands the game to another member: they become the owner and the caller a member. The caller can no
 * longer read the invitations, so both lists of the game are refreshed. The page refreshes the games list
 * (the caller's role changed), because a feature does not touch another feature's cache.
 */
export function useTransferOwnershipMutation(gameId) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (developerId) => transferOwnership({ gameId, developerId }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...TEAM_QUERY_KEYS.all, gameId] }),
  });

  return {
    transferOwnership: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
