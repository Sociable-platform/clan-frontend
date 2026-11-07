import { useCallback } from 'react';

import { useAuthStore } from '@/store';

/**
 * Clears the local session. The backend has no logout endpoint (tokens are
 * stateless JWTs), so there is nothing to call; if one is added, revoke first
 * and clear in a `finally` so a failed request cannot leave the user signed in.
 * On a protected page the auth guard then redirects to the login page.
 */
export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  return useCallback(() => clearSession(), [clearSession]);
}
