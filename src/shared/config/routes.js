/** On the games page, ?keys=<gameId> opens that game's API keys. */
export const GAME_KEYS_PARAM = 'keys';

// Every route path in one place; links and redirects import these.
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  // With email verification on, the register form leads here: enter the code from the email.
  registerVerify: '/register/verify',
  forgotPassword: '/forgot-password',
  // The emailed link opens this page with the token in the fragment: /reset-password#token=...
  resetPassword: '/reset-password',
  // The developer guide. /docs opens its first page.
  docs: '/docs',
  docsPage: (slug) => `/docs/${encodeURIComponent(slug)}`,
  docsPattern: '/docs/:slug',
  games: '/games',
  // A game has no page of its own: this is the games page with that game's API keys open.
  game: (gameId) => `/games?${GAME_KEYS_PARAM}=${encodeURIComponent(gameId)}`,
  // The old address of the game page; it redirects to `game(gameId)`.
  gamePattern: '/games/:gameId',
  widget: (gameId) => `/games/${encodeURIComponent(gameId)}/widget`,
  widgetPattern: '/games/:gameId/widget',
  // A game's team: who is on it, invitations, handing it over. Every member can open it.
  team: (gameId) => `/games/${encodeURIComponent(gameId)}/team`,
  teamPattern: '/games/:gameId/team',
  // The invitations sent to the signed-in developer.
  invitations: '/invitations',
  // Admin panel. Everything under /admin shows the 404 page to anyone who is not an admin.
  admin: {
    root: '/admin',
    login: '/admin/login',
    developers: '/admin/developers',
    developer: (developerId) => `/admin/developers/${encodeURIComponent(developerId)}`,
    developerPattern: '/admin/developers/:developerId',
  },
};
