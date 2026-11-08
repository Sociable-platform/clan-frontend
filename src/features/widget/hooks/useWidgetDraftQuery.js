import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import { getWidgetDraft } from '../api/widgetApi';
import { WIDGET_ERROR_CODES } from '../config/widgetConfig';
import { WIDGET_QUERY_KEYS } from '../config/widgetQueryKeys';

/** A game's draft config. `isGameNotFound` is the 404 for a missing or foreign game. */
export function useWidgetDraftQuery(gameId) {
  const query = useQuery({
    queryKey: WIDGET_QUERY_KEYS.draft(gameId),
    queryFn: ({ signal }) => getWidgetDraft({ gameId, signal }),
  });

  return {
    config: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    isGameNotFound:
      query.error instanceof ApiError && query.error.code === WIDGET_ERROR_CODES.GAME_NOT_FOUND,
    refetch: query.refetch,
  };
}
