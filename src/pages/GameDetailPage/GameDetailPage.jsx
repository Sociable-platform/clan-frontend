import { Link } from 'react-router-dom';

import {
  API_KEYS_MESSAGES,
  ApiKeyList,
  ApiKeyListSkeleton,
  NewApiKeyNotice,
  RevokeApiKeyDialog,
} from '@/features/apiKeys';
import { ROUTES } from '@/shared/config';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FormAlert } from '@/shared/ui/FormAlert';

import { useGameDetailPage } from './useGameDetailPage';

export function GameDetailPage() {
  const page = useGameDetailPage();

  if (page.isGameNotFound) {
    return (
      <div className="page">
        <ErrorState
          title={API_KEYS_MESSAGES.GAME_NOT_FOUND_TITLE}
          message={API_KEYS_MESSAGES.GAME_NOT_FOUND_MESSAGE}
        />
        <p>
          <Link to={ROUTES.games}>Back to games</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <p>
        <Link to={ROUTES.games}>Games</Link>
      </p>
      <h1>{page.gameName ?? 'API keys'}</h1>

      {page.newKey ? <NewApiKeyNotice apiKey={page.newKey} onDismiss={page.handleDismissNewKey} /> : null}

      <section aria-labelledby="api-keys-heading">
        <div className="toolbar">
          <h2 id="api-keys-heading" className="section-title">
            API keys
          </h2>
          <button type="button" className="button" disabled={page.isCreating} onClick={page.handleCreate}>
            {page.isCreating ? API_KEYS_MESSAGES.CREATE_PENDING : API_KEYS_MESSAGES.CREATE_LABEL}
          </button>
        </div>
        {page.hasCreateError ? <FormAlert>{API_KEYS_MESSAGES.CREATE_ERROR}</FormAlert> : null}

        {page.isLoading ? (
          <>
            <p role="status" className="visually-hidden">
              Loading API keys
            </p>
            <ApiKeyListSkeleton />
          </>
        ) : null}
        {page.isError ? (
          <ErrorState
            title={API_KEYS_MESSAGES.LIST_ERROR_TITLE}
            message="Check your connection and try again."
            onRetry={page.handleRetry}
          />
        ) : null}
        {page.isEmpty ? (
          <EmptyState
            title={API_KEYS_MESSAGES.LIST_EMPTY_TITLE}
            message={API_KEYS_MESSAGES.LIST_EMPTY_MESSAGE}
          />
        ) : null}
        {page.hasKeys ? <ApiKeyList apiKeys={page.apiKeys} onRevokeClick={page.handleRevokeClick} /> : null}
      </section>

      <RevokeApiKeyDialog
        apiKey={page.keyToRevoke}
        isPending={page.isRevoking}
        hasError={page.hasRevokeError}
        onCancel={page.handleRevokeCancel}
        onConfirm={page.handleRevokeConfirm}
      />
    </div>
  );
}
