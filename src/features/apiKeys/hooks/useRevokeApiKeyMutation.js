import { useMutation, useQueryClient } from '@tanstack/react-query';

import { revokeApiKey } from '../api/apiKeysApi';
import { API_KEYS_QUERY_KEYS } from '../config/apiKeysQueryKeys';

/** Revokes one key and refreshes the game's list so the row shows as revoked. */
export function useRevokeApiKeyMutation(gameId) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (keyId) => revokeApiKey({ keyId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEYS.byGame(gameId) }),
  });

  return {
    revokeApiKey: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    reset: mutation.reset,
  };
}
