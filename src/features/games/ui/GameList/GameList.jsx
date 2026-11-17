import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { CopyButton } from '@/shared/ui/CopyButton';
import { Icon } from '@/shared/ui/Icon';
import { formatDate } from '@/shared/utils';

import { GAME_ROLE_LABELS } from '../../config/gamesConfig';

/**
 * The games table: one row per game. The first column holds everything about the game: its name, the
 * developer's role on it, the description, when it was registered and the game ID the SDK needs (with a
 * copy button). The second holds what you can do with it, kept on one line on a wide screen.
 * Everybody on a game can customize its widget and open its team; "API keys" is for owners only, so a
 * member does not see it. It opens a panel in a row of its own under the game; the page decides which
 * game is open (`openGameId`) and what the panel holds (`renderKeys`). On a narrow screen each row is laid out
 * as a stacked block.
 */
export function GameList({ games, openGameId = null, onToggleKeys, renderKeys }) {
  return (
    <div className="games-table-scroll">
      <table className="games-table" aria-label="Your games">
        <thead>
          <tr>
            <th scope="col">Game</th>
            <th scope="col" className="games-table-actions-head">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => {
            const isOpen = game.isOwner && game.id === openGameId;
            const panelId = `game-keys-${game.id}`;
            return (
              <Fragment key={game.id}>
                <tr className={isOpen ? 'game-row game-row-open' : 'game-row'}>
                  <th scope="row">
                    <div className="game-row-game">
                      <span className="game-row-name">
                        {game.name}{' '}
                        <span
                          className={game.isOwner ? 'badge' : 'badge badge-muted'}
                          aria-label={`Your role in ${game.name}: ${GAME_ROLE_LABELS[game.role]}`}
                        >
                          {GAME_ROLE_LABELS[game.role]}
                        </span>
                      </span>
                      <span className="item-meta">{game.description || 'No description'}</span>
                      <span className="item-meta">
                        Registered <time dateTime={game.createdAt}>{formatDate(game.createdAt)}</time>
                      </span>
                      <div className="game-row-id">
                        <span className="item-meta">Game ID</span>
                        <code className="game-row-id-value" aria-label={`Game ID of ${game.name}`}>
                          {game.id}
                        </code>
                        <CopyButton value={game.id} label="Copy ID" className="button-compact" />
                      </div>
                    </div>
                  </th>
                  <td>
                    <div className="game-row-actions">
                      <Link to={ROUTES.widget(game.id)} className="button button-secondary button-with-icon">
                        <Icon name="pencil" />
                        Customize widget
                      </Link>
                      <Link
                        to={ROUTES.team(game.id)}
                        className="button button-secondary button-with-icon"
                        aria-label={`Team of ${game.name}`}
                      >
                        <Icon name="user" />
                        Team
                      </Link>
                      {game.isOwner ? (
                        <button
                          type="button"
                          className={`button button-with-icon ${isOpen ? 'button-selected' : 'button-secondary'}`}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => onToggleKeys(game.id)}
                        >
                          <Icon name="key" />
                          API keys
                          {isOpen ? <Icon name="chevronUp" /> : null}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
                {isOpen ? (
                  <tr className="game-keys-row">
                    <td colSpan={2} id={panelId}>
                      {renderKeys(game)}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
