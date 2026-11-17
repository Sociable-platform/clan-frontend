import { Link, useParams } from 'react-router-dom';

import {
  API_KEYS_MESSAGES,
  ApiKeyList,
  ApiKeyListSkeleton,
  NewApiKeyNotice,
  RevokeApiKeyDialog,
} from '@/features/apiKeys';
import { useGamesQuery } from '@/features/games';
import { ROUTES } from '@/shared/config';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Icon } from '@/shared/ui/Icon';

import { useGameApiKeys } from './useGameApiKeys';

/**
 * A game's API keys, for its owner: create (the full key is shown once, here), list, revoke.
 * The game comes from the developer's games list, so a game they are not on, or are only a member
 * of, never asks the server for keys.
 */
export function GameKeysPage() {
  const { gameId } = useParams();
  const { games, isLoading, isError, refetch } = useGamesQuery();
  const game = games.find((item) => item.id === gameId) ?? null;

  if (isLoading) {
    return (
      <div className="page">
        <p role="status" className="visually-hidden">
          Loading API keys
        </p>
        <ApiKeyListSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page">
        <ErrorState title="Could not load your games" message="Check your connection and try again." onRetry={refetch} />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="page">
        <ErrorState
          title={API_KEYS_MESSAGES.GAME_NOT_FOUND_TITLE}
          message={API_KEYS_MESSAGES.GAME_NOT_FOUND_MESSAGE}
        />
        <p>
          <Link to={ROUTES.games}>Back to your games</Link>
        </p>
      </div>
    );
  }

  if (!game.isOwner) {
    return (
      <div className="page">
        <ErrorState
          title="Only the owner sees the API keys"
          message={`You are a member of ${game.name}. Ask its owner if your game server needs a key.`}
        />
        <p>
          <Link to={ROUTES.team(game.id)}>See the team</Link>
        </p>
      </div>
    );
  }

  return <GameKeys game={game} />;
}

function GameKeys({ game }) {
  const keys = useGameApiKeys(game.id);

  if (keys.isGameNotFound) {
    return (
      <section aria-label={`API keys of ${game.name}`} className="page">
        <ErrorState
          title={API_KEYS_MESSAGES.GAME_NOT_FOUND_TITLE}
          message={API_KEYS_MESSAGES.GAME_NOT_FOUND_MESSAGE}
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="game-keys-title" className="page">
      <div className="games-header">
        <div className="games-header-text">
          <h1 id="game-keys-title">API keys of {game.name}</h1>
          <p className="games-lead">{API_KEYS_MESSAGES.PANEL_DESCRIPTION}</p>
        </div>
        <button
          type="button"
          className="button button-with-icon"
          disabled={keys.isCreating || keys.readOnlyMessage !== null}
          aria-describedby={keys.readOnlyMessage ? 'create-key-read-only' : undefined}
          onClick={keys.handleCreate}
        >
          <Icon name="plus" />
          {keys.isCreating ? API_KEYS_MESSAGES.CREATE_PENDING : API_KEYS_MESSAGES.CREATE_LABEL}
        </button>
      </div>
      {keys.readOnlyMessage ? (
        <p id="create-key-read-only" className="item-meta">
          {keys.readOnlyMessage}
        </p>
      ) : null}
      {keys.hasCreateError ? <FormAlert>{API_KEYS_MESSAGES.CREATE_ERROR}</FormAlert> : null}
      {keys.newKey ? <NewApiKeyNotice apiKey={keys.newKey} onDismiss={keys.handleDismissNewKey} /> : null}

      <div>
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
      </div>

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
