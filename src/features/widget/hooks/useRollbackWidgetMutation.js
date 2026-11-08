import { useMutation, useQueryClient } from '@tanstack/react-query';

import { rollbackWidget } from '../api/widgetApi';
import { WIDGET_QUERY_KEYS } from '../config/widgetQueryKeys';

/**
 * Publishes an earlier version again as a new one. Rejects with the `ApiError`; on success the
 * new version is cached with its config and the history is refreshed, so it shows as the newest.
 */
export function useRollbackWidgetMutation(gameId) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (version) => rollbackWidget({ gameId, version }),
    onSuccess: (created) => {
      queryClient.setQueryData(WIDGET_QUERY_KEYS.version(gameId, created.version), created);
      return queryClient.invalidateQueries({ queryKey: WIDGET_QUERY_KEYS.versions(gameId), exact: true });
    },
  });

  return {
    rollBack: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
