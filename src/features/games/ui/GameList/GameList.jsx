import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { CopyButton } from '@/shared/ui/CopyButton';
import { Icon } from '@/shared/ui/Icon';
import { formatDate } from '@/shared/utils';

/**
 * The games table: one row per game with its name, description and the game ID the SDK needs
 * (with a copy button), when it was registered and what you can do with it. "API keys" opens a
 * panel in a row of its own under the game; the page decides which game is open (`openGameId`)
 * and what the panel holds (`renderKeys`). On a phone each row is laid out as a stacked block.
 */
export function GameList({ games, openGameId = null, onToggleKeys, renderKeys }) {
  return (
    <div className="games-table-scroll">
      <table className="games-table" aria-label="Your games">
        <thead>
          <tr>
            <th scope="col">Game</th>
            <th scope="col">Registered</th>
            <th scope="col" className="games-table-actions-head">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => {
            const isOpen = game.id === openGameId;
            const panelId = `game-keys-${game.id}`;
            return (
              <Fragment key={game.id}>
                <tr className={isOpen ? 'game-row game-row-open' : 'game-row'}>
                  <th scope="row">
                    <div className="game-row-game">
                      <span className="game-row-name">{game.name}</span>
                      <span className="item-meta">{game.description || 'No description'}</span>
                      <div className="game-row-id">
                        <span className="item-meta">Game ID</span>
                        <code className="game-row-id-value" aria-label={`Game ID of ${game.name}`}>
                          {game.id}
                        </code>
                        <CopyButton value={game.id} label="Copy ID" className="button-compact" />
                      </div>
                    </div>
                  </th>
                  <td className="game-row-date">{formatDate(game.createdAt)}</td>
                  <td>
                    <div className="game-row-actions">
                      <Link to={ROUTES.widget(game.id)} className="button button-secondary button-with-icon">
                        <Icon name="pencil" />
                        Customize widget
                      </Link>
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
                    </div>
                  </td>
                </tr>
                {isOpen ? (
                  <tr className="game-keys-row">
                    <td colSpan={3} id={panelId}>
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
