import { useEffect } from 'react';

import { ApiError, registerSessionHandlers } from '@/shared/api';
import { readStoredSession, ROLES, useAuthStore } from '@/store';

import { getCurrentAdmin, getCurrentDeveloper } from '../api/authApi';

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
      onUnauthorized: () => getState().clearSession(),
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
