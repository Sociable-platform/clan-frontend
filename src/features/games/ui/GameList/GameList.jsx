import { Link } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { CopyButton } from '@/shared/ui/CopyButton';
import { Icon } from '@/shared/ui/Icon';
import { formatDate } from '@/shared/utils';

import { GAME_ROLE_LABELS } from '../../config/gamesConfig';

/**
 * The games table: one row per game. The first column holds everything about the game: its name, the
 * developer's role on it, the description, when it was registered and the game ID the SDK needs (with a
 * copy button). The second has one link, Open, which goes into the game: its widget, team and API
 * keys are then in the sidebar. On a narrow screen each row is laid out as a stacked block.
 */
export function GameList({ games }) {
  return (
    <div className="games-table-scroll">
      <table className="games-table" aria-label="Your games">
        <thead>
          <tr>
            <th scope="col">Game</th>
            <th scope="col" className="games-table-actions-head">
              Open
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => {
            return (
                <tr key={game.id} className="game-row">
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
                      <Link
                        to={ROUTES.game(game.id)}
                        className="button button-secondary button-with-icon"
                        aria-label={`Open ${game.name}`}
                      >
                        Open
                        <Icon name="chevronRight" />
                      </Link>
                    </div>
                  </td>
                </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
