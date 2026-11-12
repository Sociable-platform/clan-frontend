// Persists the developer token so a page reload keeps the session. The backend
// issues a bearer token in the response body (no cookie), so the browser has to
// hold it. Kept in this one module so the storage choice can change in one place.
const STORAGE_KEY = 'clan.dashboard.session';

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    // Blocked storage (private mode, disabled site data): the session lasts until reload.
    return null;
  }
}

/** Returns `{ token, expiresAt }` (expiresAt in ms) or null when absent, malformed or expired. */
export function readStoredSession() {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
    const isValid =
      typeof parsed?.token === 'string' &&
      parsed.token !== '' &&
      typeof parsed.expiresAt === 'number' &&
      parsed.expiresAt > Date.now();
    if (isValid) return { token: parsed.token, expiresAt: parsed.expiresAt };
  } catch {
    // Unparseable value: treated like no session.
  }
  clearStoredSession();
  return null;
}

export function writeStoredSession({ token, expiresAt }) {
  try {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt }));
  } catch {
    // Quota or blocked storage: the in-memory session still works.
  }
}

export function clearStoredSession() {
  try {
    getStorage()?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
