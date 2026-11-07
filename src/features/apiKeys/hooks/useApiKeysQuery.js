import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import { listApiKeys } from '../api/apiKeysApi';
import { API_KEYS_ERROR_CODES } from '../config/apiKeysConfig';
import { API_KEYS_QUERY_KEYS } from '../config/apiKeysQueryKeys';

/** A game's keys, active and revoked. `isGameNotFound` is the 404 for a missing or foreign game. */
export function useApiKeysQuery(gameId) {
  const query = useQuery({
    queryKey: API_KEYS_QUERY_KEYS.byGame(gameId),
    queryFn: ({ signal }) => listApiKeys({ gameId, signal }),
  });

  return {
    apiKeys: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    isGameNotFound:
      query.error instanceof ApiError && query.error.code === API_KEYS_ERROR_CODES.GAME_NOT_FOUND,
    refetch: query.refetch,
  };
}
