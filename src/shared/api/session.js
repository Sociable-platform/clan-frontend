// Bridge between the HTTP client and the (future) auth store. The session
// initializer registers the real callbacks at startup; until then requests go
// out unauthenticated and 401s are ignored.
const handlers = {
  getToken: () => null,
  onUnauthorized: () => {},
};

export function registerSessionHandlers({ getToken, onUnauthorized }) {
  handlers.getToken = getToken;
  handlers.onUnauthorized = onUnauthorized;
}

export const sessionBridge = {
  getToken: () => handlers.getToken(),
  onUnauthorized: (error) => handlers.onUnauthorized(error),
};
