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
    developerPattern: '/admin/developers/:developerId',
  },
};
