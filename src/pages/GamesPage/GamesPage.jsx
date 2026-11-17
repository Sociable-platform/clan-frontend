import { Link } from 'react-router-dom';

import { GAMES_MESSAGES, GameList, GameListSkeleton, RegisterGameDialog } from '@/features/games';
import { ROUTES } from '@/shared/config';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Icon } from '@/shared/ui/Icon';

import { GameApiKeysPanel } from './GameApiKeysPanel';
import { useGamesPage } from './useGamesPage';

export function GamesPage() {
  const page = useGamesPage();

  return (
    <div className="page">
      <div className="games-header">
        <div className="games-header-text">
          <h1>Your games</h1>
          <p className="games-lead">{GAMES_MESSAGES.PAGE_LEAD}</p>
        </div>
        <button
          type="button"
          className="button button-with-icon"
          disabled={page.readOnlyMessage !== null}
          aria-describedby={page.readOnlyMessage ? 'games-read-only' : undefined}
          onClick={page.handleRegisterOpen}
        >
          <Icon name="plus" />
          {GAMES_MESSAGES.REGISTER_SUBMIT}
        </button>
      </div>
      {page.readOnlyMessage ? (
        <p id="games-read-only" className="item-meta">
          {page.readOnlyMessage}
        </p>
      ) : null}
      {page.pendingInvitations > 0 ? (
        <p role="status" className="invitations-notice">
          {page.pendingInvitations === 1
            ? 'You have 1 pending invitation to a game.'
            : `You have ${page.pendingInvitations} pending invitations to games.`}{' '}
          <Link to={ROUTES.invitations}>Review invitations</Link>
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
          <div className="games-card">
            <div className="games-search">
              <label className="games-search-field">
                <Icon name="search" />
                <span className="visually-hidden">{GAMES_MESSAGES.SEARCH_LABEL}</span>
                <input
                  type="search"
                  className="games-search-input"
                  placeholder={GAMES_MESSAGES.SEARCH_LABEL}
                  value={page.search}
                  onChange={page.handleSearchChange}
                />
              </label>
            </div>
            {page.hasNoMatches ? (
              <EmptyState title={GAMES_MESSAGES.SEARCH_EMPTY_TITLE} message={GAMES_MESSAGES.SEARCH_EMPTY_MESSAGE} />
            ) : (
              <GameList
                games={page.games}
                openGameId={page.openGameId}
                onToggleKeys={page.handleToggleKeys}
                renderKeys={(game) => <GameApiKeysPanel game={game} />}
              />
            )}
          </div>
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
