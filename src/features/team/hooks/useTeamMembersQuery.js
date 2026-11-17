import { useQuery } from '@tanstack/react-query';

import { listMembers } from '../api/teamApi';
import { TEAM_QUERY_KEYS } from '../config/teamQueryKeys';
import { isGameNotFound } from '../utils/teamErrors';

/** Everybody on a game, owners first. Every member of the game may read it. `isGameNotFound` is the 404 for a game the developer is not on. */
export function useTeamMembersQuery(gameId) {
  const query = useQuery({
    queryKey: TEAM_QUERY_KEYS.members(gameId),
    queryFn: ({ signal }) => listMembers({ gameId, signal }),
  });

  return {
    members: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    isGameNotFound: isGameNotFound(query.error),
    refetch: query.refetch,
  };
}
