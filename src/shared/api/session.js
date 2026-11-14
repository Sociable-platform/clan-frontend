// Bridge between the HTTP client and the auth store. The session initializer registers the real
// callbacks at startup; until then requests go out unauthenticated and 401s and suspensions are ignored.
const handlers = {
  getToken: () => null,
  onUnauthorized: () => {},
  onAccountSuspended: () => {},
};

export function registerSessionHandlers({ getToken, onUnauthorized, onAccountSuspended = () => {} }) {
  handlers.getToken = getToken;
  handlers.onUnauthorized = onUnauthorized;
  handlers.onAccountSuspended = onAccountSuspended;
}

export const sessionBridge = {
  getToken: () => handlers.getToken(),
  onUnauthorized: (error) => handlers.onUnauthorized(error),
  onAccountSuspended: (error) => handlers.onAccountSuspended(error),
};
