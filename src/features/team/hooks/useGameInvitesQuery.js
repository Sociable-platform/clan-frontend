import { useQuery } from '@tanstack/react-query';

import { listGameInvites } from '../api/teamApi';
import { TEAM_QUERY_KEYS } from '../config/teamQueryKeys';

/**
 * A game's pending invitations. Only owners may read them (a member would get 403), so `enabled` is false
 * for a member and nothing is requested.
 */
export function useGameInvitesQuery(gameId, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: TEAM_QUERY_KEYS.invites(gameId),
    queryFn: ({ signal }) => listGameInvites({ gameId, signal }),
    enabled,
  });

  return {
    invites: query.data ?? [],
    isLoading: enabled && query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
