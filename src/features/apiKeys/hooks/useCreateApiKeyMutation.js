import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createApiKey } from '../api/apiKeysApi';
import { API_KEYS_QUERY_KEYS } from '../config/apiKeysQueryKeys';

/**
 * Resolves with the new key including its one-time secret. The secret is deliberately not
 * put in the query cache: the caller keeps it in component state until the person dismisses it.
 */
export function useCreateApiKeyMutation(gameId) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => createApiKey({ gameId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEYS.byGame(gameId) }),
  });

  return {
    createApiKey: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    reset: mutation.reset,
  };
}
