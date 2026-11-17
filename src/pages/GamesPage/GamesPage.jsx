import { GAMES_MESSAGES, GameList, GameListSkeleton, RegisterGameForm } from '@/features/games';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';

import { useGamesPage } from './useGamesPage';

export function GamesPage() {
  const { games, isLoading, isError, isEmpty, hasGames, form, readOnlyMessage, handleRetry } = useGamesPage();

  return (
    <div className="page">
      <h1>Your games</h1>
      <div className="page-grid">
        <section aria-label="Registered games">
          {isLoading ? (
            <>
              <p role="status" className="visually-hidden">
                Loading games
              </p>
              <GameListSkeleton />
            </>
          ) : null}
          {isError ? (
            <ErrorState
              title={GAMES_MESSAGES.LIST_ERROR_TITLE}
              message="Check your connection and try again."
              onRetry={handleRetry}
            />
          ) : null}
          {isEmpty ? (
            <EmptyState title={GAMES_MESSAGES.LIST_EMPTY_TITLE} message={GAMES_MESSAGES.LIST_EMPTY_MESSAGE} />
          ) : null}
          {hasGames ? <GameList games={games} /> : null}
        </section>
        <div className="card">
          <RegisterGameForm
            values={form.values}
            fieldErrors={form.fieldErrors}
            formError={form.formError}
            isPending={form.isPending}
            readOnlyMessage={readOnlyMessage}
            onChange={form.handleChange}
            onSubmit={form.handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
