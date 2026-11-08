import { useMutation, useQueryClient } from '@tanstack/react-query';

import { saveWidgetDraft } from '../api/widgetApi';
import { WIDGET_QUERY_KEYS } from '../config/widgetQueryKeys';

/**
 * Rejects with the `ApiError` so the form can show it. On success the cache takes the saved
 * config instead of refetching, so coming back to the page shows what was last saved.
 * (These callbacks run even if the page was left while the request was in flight.)
 */
export function useSaveWidgetDraftMutation(gameId) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (config) => saveWidgetDraft({ gameId, config }),
    onSuccess: (_result, config) => queryClient.setQueryData(WIDGET_QUERY_KEYS.draft(gameId), config),
  });

  return { saveDraft: mutation.mutateAsync, isPending: mutation.isPending };
}
