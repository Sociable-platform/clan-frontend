/** An old link: /games?keys=<gameId> used to open that game's API keys on the games page. It now redirects to the game's API keys page. */
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
  // Where to write for help. Public.
  support: '/support',
  games: '/games',
  // Where "open this game" lands: its team page, which every member can see.
  game: (gameId) => `/games/${encodeURIComponent(gameId)}/team`,
  // A game has no page at this address; it redirects to `game(gameId)`.
  gamePattern: '/games/:gameId',
  // A game's API keys. For its owner only.
  gameKeys: (gameId) => `/games/${encodeURIComponent(gameId)}/keys`,
  gameKeysPattern: '/games/:gameId/keys',
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
