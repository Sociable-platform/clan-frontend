import { useMutation, useQueryClient } from '@tanstack/react-query';

import { publishWidget } from '../api/widgetApi';
import { WIDGET_QUERY_KEYS } from '../config/widgetQueryKeys';

/**
 * Rejects with the `ApiError` so the caller can explain it. On success the new version is
 * cached with its config and the history is refreshed.
 */
export function usePublishWidgetMutation(gameId) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => publishWidget({ gameId }),
    onSuccess: (published) => {
      queryClient.setQueryData(WIDGET_QUERY_KEYS.version(gameId, published.version), published);
      return queryClient.invalidateQueries({ queryKey: WIDGET_QUERY_KEYS.versions(gameId), exact: true });
    },
  });

  return { publish: mutation.mutateAsync, isPending: mutation.isPending };
}
