import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  useApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} from '@/features/apiKeys';
import { useAccountAccess } from '@/features/auth';
import { useGamesQuery } from '@/features/games';

/**
 * Owns the data and UI state for one game's API keys. The full key of a freshly created
 * key lives only in `newKey` (component state): it is never cached, so leaving the page
 * or dismissing the notice discards it for good.
 */
export function useGameDetailPage() {
  const { gameId } = useParams();
  const { games } = useGamesQuery();
  const keysQuery = useApiKeysQuery(gameId);
  const create = useCreateApiKeyMutation(gameId);
  const revoke = useRevokeApiKeyMutation(gameId);
  // A suspended account is read-only. Revoking a key stays allowed (the backend lets it through).
  const { readOnlyMessage } = useAccountAccess();
  const [newKey, setNewKey] = useState(null);
  const [keyToRevoke, setKeyToRevoke] = useState(null);

  const game = games.find((candidate) => candidate.id === gameId) ?? null;

  const handleCreate = async () => {
    try {
      setNewKey(await create.createApiKey());
    } catch {
      // The mutation's error state drives the message shown next to the button.
    }
  };

  const handleDismissNewKey = () => setNewKey(null);

  const handleRevokeClick = (apiKey) => {
    revoke.reset();
    setKeyToRevoke(apiKey);
  };

  const handleRevokeCancel = () => {
    if (!revoke.isPending) setKeyToRevoke(null);
  };

  const handleRevokeConfirm = async () => {
    try {
      await revoke.revokeApiKey(keyToRevoke.id);
      setKeyToRevoke(null);
    } catch {
      // Keep the dialog open; `revoke.isError` shows the message and the person can retry.
    }
  };

  return {
    gameName: game?.name ?? null,
    apiKeys: keysQuery.apiKeys,
    isLoading: keysQuery.isLoading,
    isError: keysQuery.isError && !keysQuery.isGameNotFound,
    isGameNotFound: keysQuery.isGameNotFound,
    isEmpty: !keysQuery.isLoading && !keysQuery.isError && keysQuery.apiKeys.length === 0,
    hasKeys: keysQuery.apiKeys.length > 0,
    newKey,
    keyToRevoke,
    isCreating: create.isPending,
    // Once the account is known to be suspended, the read-only explanation says it all: "Try again" would be wrong.
    hasCreateError: create.isError && readOnlyMessage === null,
    isRevoking: revoke.isPending,
    hasRevokeError: revoke.isError,
    readOnlyMessage,
    handleRetry: keysQuery.refetch,
    handleCreate,
    handleDismissNewKey,
    handleRevokeClick,
    handleRevokeCancel,
    handleRevokeConfirm,
  };
}
