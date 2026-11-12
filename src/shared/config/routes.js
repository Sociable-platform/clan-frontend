// Every route path in one place; links and redirects import these.
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  games: '/games',
  game: (gameId) => `/games/${encodeURIComponent(gameId)}`,
  gamePattern: '/games/:gameId',
  widget: (gameId) => `/games/${encodeURIComponent(gameId)}/widget`,
  widgetPattern: '/games/:gameId/widget',
  // Admin panel. Everything under /admin shows the 404 page to anyone who is not an admin.
  admin: {
    root: '/admin',
    login: '/admin/login',
    developers: '/admin/developers',
    developer: (developerId) => `/admin/developers/${encodeURIComponent(developerId)}`,
  },
};
