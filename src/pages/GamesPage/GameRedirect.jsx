import { Navigate, useParams } from 'react-router-dom';

import { ROUTES } from '@/shared/config';

/** /games/:gameId has no page of its own: it opens the game (its team page). */
export function GameRedirect() {
  const { gameId } = useParams();
  return <Navigate to={ROUTES.game(gameId)} replace />;
}
