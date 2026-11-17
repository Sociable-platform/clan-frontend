import { Link } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { CopyButton } from '@/shared/ui/CopyButton';
import { formatDateTime } from '@/shared/utils';

/**
 * One row per game: what it is on the left (name, description, the game ID the SDK needs, with a
 * copy button), what you can do with it on the right.
 */
export function GameList({ games }) {
  return (
    <ul className="item-list" aria-label="Your games">
      {games.map((game) => (
        <li key={game.id} className="item-row game-row">
          <div className="item-main">
            <Link to={ROUTES.game(game.id)} className="item-title">
              {game.name}
            </Link>
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
            <Link to={ROUTES.game(game.id)} className="button button-secondary">
              API keys
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
