import { Navigate, useParams } from 'react-router-dom';

import { ROUTES } from '@/shared/config';

/** The old address of a game's own page (/games/:gameId) now opens the games page with that game's API keys. */
export function GameRedirect() {
  const { gameId } = useParams();
  return <Navigate to={ROUTES.game(gameId)} replace />;
}
