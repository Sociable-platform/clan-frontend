import { useMutation, useQueryClient } from '@tanstack/react-query';

import { leaveGame } from '../api/teamApi';
import { TEAM_QUERY_KEYS } from '../config/teamQueryKeys';

/** Leaves the game. The game is a 404 for the caller afterwards, so its team is dropped from the cache. */
export function useLeaveGameMutation(gameId) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => leaveGame({ gameId }),
    onSuccess: () => queryClient.removeQueries({ queryKey: [...TEAM_QUERY_KEYS.all, gameId] }),
  });

  return {
    leaveGame: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
