// Every route path in one place; links and redirects import these.
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  games: '/games',
  game: (gameId) => `/games/${encodeURIComponent(gameId)}`,
  gamePattern: '/games/:gameId',
};
