// Bridge between the HTTP client and the auth store. The session initializer registers the real
// callbacks at startup; until then requests go out unauthenticated and 401s and suspensions are ignored.
const handlers = {
  getToken: () => null,
  // No session to continue until the initializer says how.
  refreshToken: async () => null,
  onUnauthorized: () => {},
  onAccountSuspended: () => {},
};

export function registerSessionHandlers({
  getToken,
  refreshToken = async () => null,
  onUnauthorized,
  onAccountSuspended = () => {},
}) {
  handlers.getToken = getToken;
  handlers.refreshToken = refreshToken;
  handlers.onUnauthorized = onUnauthorized;
  handlers.onAccountSuspended = onAccountSuspended;
}

export const sessionBridge = {
  getToken: () => handlers.getToken(),
  refreshToken: () => handlers.refreshToken(),
  onUnauthorized: (error) => handlers.onUnauthorized(error),
  onAccountSuspended: (error) => handlers.onAccountSuspended(error),
};
