import { Link } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { CopyButton } from '@/shared/ui/CopyButton';
import { formatDateTime } from '@/shared/utils';

/**
 * One row per game: what it is on the left (name, description, the game ID the SDK needs, with a
 * copy button), what you can do with it on the right. "API keys" opens a panel under the row;
 * the page decides which game is open (`openGameId`) and what the panel holds (`renderKeys`).
 */
export function GameList({ games, openGameId = null, onToggleKeys, renderKeys }) {
  return (
    <ul className="item-list" aria-label="Your games">
      {games.map((game) => {
        const isOpen = game.id === openGameId;
        const panelId = `game-keys-${game.id}`;
        return (
          <li key={game.id} className="game-item">
            <div className="item-row game-row">
              <div className="item-main">
                <h2 className="item-title game-row-name">{game.name}</h2>
                {game.description ? <p className="item-text">{game.description}</p> : null}
                <div className="game-row-id">
                  <span className="item-meta">Game ID</span>
                  <code className="game-row-id-value" aria-label={`Game ID of ${game.name}`}>
                    {game.id}
                  </code>
                  <CopyButton value={game.id} label="Copy ID" className="button-compact" />
                </div>
                <span className="item-meta">Registered {formatDateTime(game.createdAt)}</span>
              </div>
              <div className="game-row-actions">
                <Link to={ROUTES.widget(game.id)} className="button button-secondary">
                  Customize widget
                </Link>
                <button
                  type="button"
                  className="button button-secondary"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => onToggleKeys(game.id)}
                >
                  API keys
                </button>
              </div>
            </div>
            {isOpen ? <div id={panelId}>{renderKeys(game)}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}
