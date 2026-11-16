import { useEffect } from 'react';

import { ApiError, registerSessionHandlers } from '@/shared/api';
import { readStoredSession, ROLES, useAuthStore } from '@/store';

import { getCurrentAdmin, getCurrentDeveloper, refreshDeveloperSession } from '../api/authApi';
import { refreshDeveloperProfile } from '../utils/refreshDeveloperProfile';

/**
 * Runs once at startup: wires the HTTP client to the auth store, then restores a
 * stored developer or admin session by asking the backend who the token belongs to. Route guards
 * wait while the store status is `initializing`.
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
    // The stored role decides which `/me` to ask; the profile lands under the matching key.
    const isAdmin = stored.role === ROLES.ADMIN;
    const request = { token: stored.token, signal: controller.signal };
    const restore = isAdmin
      ? getCurrentAdmin(request).then((admin) => ({ admin }))
      : getCurrentDeveloper(request).then((developer) => ({ developer }));
    restore
      .then((profile) => getState().startSession({ ...stored, ...profile }))
      .catch((error) => {
        if (controller.signal.aborted) return; // effect re-ran (StrictMode) or unmounted
        // A rejected token is dead for good; an unreachable backend is not.
        if (error instanceof ApiError && error.status === 401) getState().clearSession();
        else getState().markUnauthenticated();
      });

    return () => controller.abort();
  }, []);
}
