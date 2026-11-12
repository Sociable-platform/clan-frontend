import { Link } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { formatDateTime } from '@/shared/utils';

export function GameList({ games }) {
  return (
    <ul className="item-list" aria-label="Your games">
      {games.map((game) => (
        <li key={game.id} className="item-row">
          <div className="item-main">
            <Link to={ROUTES.game(game.id)} className="item-title">
              {game.name}
            </Link>
            {game.description ? <p className="item-text">{game.description}</p> : null}
          </div>
          <span className="item-meta">Registered {formatDateTime(game.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
