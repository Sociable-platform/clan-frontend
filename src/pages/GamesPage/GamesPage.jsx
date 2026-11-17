import { GAMES_MESSAGES, GameList, GameListSkeleton, RegisterGameDialog } from '@/features/games';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';

import { GameApiKeysPanel } from './GameApiKeysPanel';
import { useGamesPage } from './useGamesPage';

export function GamesPage() {
  const page = useGamesPage();

  return (
    <div className="page">
      <div className="toolbar">
        <h1 className="games-title">Your games</h1>
        <button
          type="button"
          className="button"
          disabled={page.readOnlyMessage !== null}
          aria-describedby={page.readOnlyMessage ? 'games-read-only' : undefined}
          onClick={page.handleRegisterOpen}
        >
          {GAMES_MESSAGES.REGISTER_SUBMIT}
        </button>
      </div>
      {page.readOnlyMessage ? (
        <p id="games-read-only" className="item-meta games-read-only">
          {page.readOnlyMessage}
        </p>
      ) : null}
      <section aria-label="Registered games">
        {page.isLoading ? (
          <>
            <p role="status" className="visually-hidden">
              Loading games
            </p>
            <GameListSkeleton />
          </>
        ) : null}
        {page.isError ? (
          <ErrorState
            title={GAMES_MESSAGES.LIST_ERROR_TITLE}
            message="Check your connection and try again."
            onRetry={page.handleRetry}
          />
        ) : null}
        {page.isEmpty ? (
          <EmptyState title={GAMES_MESSAGES.LIST_EMPTY_TITLE} message={GAMES_MESSAGES.LIST_EMPTY_MESSAGE} />
        ) : null}
        {page.hasGames ? (
          <GameList
            games={page.games}
            openGameId={page.openGameId}
            onToggleKeys={page.handleToggleKeys}
            renderKeys={(game) => <GameApiKeysPanel game={game} />}
          />
        ) : null}
      </section>
      <RegisterGameDialog
        open={page.isRegisterOpen}
        form={page.form}
        readOnlyMessage={page.readOnlyMessage}
        onClose={page.handleRegisterClose}
      />
    </div>
  );
}
