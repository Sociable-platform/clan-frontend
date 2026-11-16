import { isRole, ROLES } from './roles';

// What survives a page reload, in localStorage. Kept in this one module so the storage choice
// can change in one place.
//
// - A developer session: only the fact that there is one, `{ role: 'developer' }`. The developer
//   token lives in memory, and the refresh token in an HttpOnly cookie that JavaScript cannot
//   read. After a reload the dashboard sees the marker and asks the server for a new token with
//   that cookie. The marker is not a credential: it only spares visitors who never logged in a
//   refused request on every page load.
// - An admin session: the token itself, as before. Admins have no refresh token.
const STORAGE_KEY = 'clan.dashboard.session';

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    // Blocked storage (private mode, disabled site data): the session lasts until reload.
    return null;
  }
}

/**
 * Returns what is stored, or null when nothing is, or it is malformed or expired:
 * `{ role: 'developer' }` for a developer, `{ token, expiresAt, role: 'admin' }` (expiresAt in
 * ms) for an admin.
 *
 * A value written before roles existed has no `role` and is a developer session. A developer
 * token written by an older version is dropped here: only the marker is returned and kept.
 */
export function readStoredSession() {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
    if (parsed && typeof parsed === 'object') {
      const role = parsed.role ?? ROLES.DEVELOPER;
      if (role === ROLES.DEVELOPER) {
        if ('token' in parsed) writeStoredSession({ role });
        return { role };
      }
      const isValid =
        isRole(role) &&
        typeof parsed.token === 'string' &&
        parsed.token !== '' &&
        typeof parsed.expiresAt === 'number' &&
        parsed.expiresAt > Date.now();
      if (isValid) return { token: parsed.token, expiresAt: parsed.expiresAt, role };
    }
  } catch {
    // Unparseable value: treated like no session.
  }
  clearStoredSession();
  return null;
}

/** Stores the session for the next page load. A developer's token is never written. */
export function writeStoredSession({ token, expiresAt, role }) {
  const value = role === ROLES.DEVELOPER ? { role } : { token, expiresAt, role };
  try {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(value));
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
