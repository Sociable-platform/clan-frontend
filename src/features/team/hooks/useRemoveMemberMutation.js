import { useMutation, useQueryClient } from '@tanstack/react-query';

import { removeMember } from '../api/teamApi';
import { TEAM_QUERY_KEYS } from '../config/teamQueryKeys';

/** Removes a developer from the game; they lose access at once. The team list refreshes whatever the answer. */
export function useRemoveMemberMutation(gameId) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (developerId) => removeMember({ gameId, developerId }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEYS.members(gameId) }),
  });

  return {
    removeMember: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
