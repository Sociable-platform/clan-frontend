import { useCallback } from 'react';

import { ROLES, useAuthStore } from '@/store';

import { logoutDeveloper } from '../api/authApi';

/**
 * Logs out. For a developer the server is told first, so the refresh token of this login stops
 * working and the cookie is cleared; the local session is cleared afterwards whatever the server
 * answered, so a failed request cannot leave the user signed in. An admin session has nothing on
 * the server to end (its token is a stateless JWT) and is only cleared here.
 * On a protected page the auth guard then redirects to the login page.
 */
export function useLogout() {
  return useCallback(async () => {
    const { role, clearSession } = useAuthStore.getState();
    try {
      if (role === ROLES.DEVELOPER) await logoutDeveloper();
    } catch {
      // Offline or a server error: the developer is logged out here anyway. The refresh token
      // then stays valid on the server until it expires, but this browser no longer uses it.
    } finally {
      clearSession();
    }
  }, []);
}
