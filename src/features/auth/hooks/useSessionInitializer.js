import { useEffect } from 'react';

import { ApiError, registerSessionHandlers } from '@/shared/api';
import { readStoredSession, ROLES, useAuthStore } from '@/store';

import { getCurrentAdmin, getCurrentDeveloper, refreshDeveloperSession } from '../api/authApi';
import { refreshDeveloperProfile } from '../utils/refreshDeveloperProfile';

/**
 * Runs once at startup: wires the HTTP client to the auth store, then restores the session of the
 * last page load. A developer session continues with the refresh cookie (the token itself is never
 * stored); an admin session with its stored token. Route guards wait while the store status is
 * `initializing`.
 */
export function useSessionInitializer() {
  useEffect(() => {
    const { getState } = useAuthStore;

    registerSessionHandlers({
      getToken: () => getState().token,
      // The HTTP client asks for this when a request is answered 401 (an expired token). A
      // developer session continues with the refresh cookie; an admin session has none.
      refreshToken: async () => {
        if (getState().role !== ROLES.DEVELOPER) return null;
        try {
          const session = await refreshDeveloperSession();
          return getState().renewToken(session) ? session.token : null;
        } catch (error) {
          // The server refused (no session to continue, or a backend without the endpoint): the
          // session is over. Anything else (offline, a 5xx) says nothing about the session.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return null;
          throw error;
        }
      },
      // Runs only when the refresh above could not continue the session.
      onUnauthorized: () => getState().clearSession(),
      // A write was refused because an admin suspended the account while the dashboard was open:
      // go read-only now, then fetch the profile for the reason. Once per suspension, not once per
      // refused request.
      onAccountSuspended: () => {
        if (!getState().markDeveloperSuspended()) return;
        refreshDeveloperProfile().catch(() => {
          // Read-only already; the banner uses its generic text until the reason can be fetched.
        });
      },
    });

    const stored = readStoredSession();
    if (!stored) {
      getState().markUnauthenticated();
      return undefined;
    }

    const controller = new AbortController();
    const { signal } = controller;
    // An admin's token is stored; `/admin/me` says who it belongs to. A developer's is not: the
    // refresh cookie gets a new one, then `/developers/me` says who it belongs to.
    const isAdmin = stored.role === ROLES.ADMIN;
    const restore = isAdmin
      ? getCurrentAdmin({ token: stored.token, signal }).then((admin) => ({ ...stored, admin }))
      : refreshDeveloperSession({ signal }).then(async (session) => {
          const developer = await getCurrentDeveloper({ token: session.token, signal });
          return { ...session, role: ROLES.DEVELOPER, developer };
        });
    restore
      .then((session) => getState().startSession(session))
      .catch((error) => {
        if (signal.aborted) return; // effect re-ran (StrictMode) or unmounted
        // A session the server refuses is over for good; an unreachable backend says nothing.
        // For a developer any refusal counts (also a backend without the refresh endpoint).
        const status = error instanceof ApiError ? error.status : 0;
        const refused = isAdmin ? status === 401 : status >= 400 && status < 500;
        if (refused) getState().clearSession();
        else getState().markUnauthenticated();
      });

    return () => controller.abort();
  }, []);
}
