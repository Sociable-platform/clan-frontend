import { useQuery } from '@tanstack/react-query';

import { listWidgetVersions } from '../api/widgetApi';
import { WIDGET_QUERY_KEYS } from '../config/widgetQueryKeys';

/** A game's published versions, newest first, without configs. */
export function useWidgetVersionsQuery(gameId) {
  const query = useQuery({
    queryKey: WIDGET_QUERY_KEYS.versions(gameId),
    queryFn: ({ signal }) => listWidgetVersions({ gameId, signal }),
  });

  return {
    versions: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
