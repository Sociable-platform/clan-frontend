import {
  API_KEYS_MESSAGES,
  ApiKeyList,
  ApiKeyListSkeleton,
  NewApiKeyNotice,
  RevokeApiKeyDialog,
} from '@/features/apiKeys';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FormAlert } from '@/shared/ui/FormAlert';

import { useGameApiKeys } from './useGameApiKeys';

/**
 * A game's API keys, shown under its row on the games page: create (the full key is shown once,
 * here), list, revoke. It is mounted only while open, so the keys are fetched on first open.
 */
export function GameApiKeysPanel({ game }) {
  const keys = useGameApiKeys(game.id);

  if (keys.isGameNotFound) {
    return (
      <section aria-label={`API keys of ${game.name}`} className="game-keys">
        <ErrorState
          title={API_KEYS_MESSAGES.GAME_NOT_FOUND_TITLE}
          message={API_KEYS_MESSAGES.GAME_NOT_FOUND_MESSAGE}
        />
      </section>
    );
  }

  return (
    <section aria-label={`API keys of ${game.name}`} className="game-keys">
      {keys.newKey ? <NewApiKeyNotice apiKey={keys.newKey} onDismiss={keys.handleDismissNewKey} /> : null}

      <div className="toolbar">
        <h3 className="section-title">API keys</h3>
        <button
          type="button"
          className="button"
          disabled={keys.isCreating || keys.readOnlyMessage !== null}
          aria-describedby={keys.readOnlyMessage ? 'create-key-read-only' : undefined}
          onClick={keys.handleCreate}
        >
          {keys.isCreating ? API_KEYS_MESSAGES.CREATE_PENDING : API_KEYS_MESSAGES.CREATE_LABEL}
        </button>
      </div>
      {keys.readOnlyMessage ? (
        <p id="create-key-read-only" className="item-meta">
          {keys.readOnlyMessage}
        </p>
      ) : null}
      {keys.hasCreateError ? <FormAlert>{API_KEYS_MESSAGES.CREATE_ERROR}</FormAlert> : null}

      {keys.isLoading ? (
        <>
          <p role="status" className="visually-hidden">
            Loading API keys
          </p>
          <ApiKeyListSkeleton />
        </>
      ) : null}
      {keys.isError ? (
        <ErrorState
          title={API_KEYS_MESSAGES.LIST_ERROR_TITLE}
          message="Check your connection and try again."
          onRetry={keys.handleRetry}
        />
      ) : null}
      {keys.isEmpty ? (
        <EmptyState title={API_KEYS_MESSAGES.LIST_EMPTY_TITLE} message={API_KEYS_MESSAGES.LIST_EMPTY_MESSAGE} />
      ) : null}
      {keys.hasKeys ? <ApiKeyList apiKeys={keys.apiKeys} onRevokeClick={keys.handleRevokeClick} /> : null}

      <RevokeApiKeyDialog
        apiKey={keys.keyToRevoke}
        isPending={keys.isRevoking}
        hasError={keys.hasRevokeError}
        onCancel={keys.handleRevokeCancel}
        onConfirm={keys.handleRevokeConfirm}
      />
    </section>
  );
}
