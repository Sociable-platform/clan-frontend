import { useQuery } from '@tanstack/react-query';

import { listGames } from '../api/gamesApi';
import { GAMES_QUERY_KEYS } from '../config/gamesQueryKeys';

/** The logged-in developer's games. Returns only what the UI needs. */
export function useGamesQuery() {
  const query = useQuery({
    queryKey: GAMES_QUERY_KEYS.list(),
    queryFn: ({ signal }) => listGames({ signal }),
  });

  return {
    games: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
