import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import { getWidgetVersion } from '../api/widgetApi';
import { WIDGET_ERROR_CODES } from '../config/widgetConfig';
import { WIDGET_QUERY_KEYS } from '../config/widgetQueryKeys';

/**
 * One published version with its config; nothing is fetched while `version` is null. Published
 * versions never change, so the cache never goes stale.
 */
export function useWidgetVersionQuery(gameId, version) {
  const query = useQuery({
    queryKey: WIDGET_QUERY_KEYS.version(gameId, version),
    queryFn: ({ signal }) => getWidgetVersion({ gameId, version, signal }),
    enabled: version !== null && version !== undefined,
    staleTime: Infinity,
  });

  return {
    version: query.data ?? null,
    isLoading: query.isPending && query.fetchStatus !== 'idle',
    isError: query.isError,
    isVersionNotFound:
      query.error instanceof ApiError && query.error.code === WIDGET_ERROR_CODES.VERSION_NOT_FOUND,
    refetch: query.refetch,
  };
}
