import { useEffect } from 'react';

import { AUTH_STATUS, useAuthStore } from '@/store';

/**
 * Empties the server-state cache when the session ends (log out or an expired token) or changes
 * role (developer logging in as admin, or back), so the next person on this browser never sees
 * the previous one's games, keys or the admin's developer list.
 */
export function useClearCacheOnSignOut(queryClient) {
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        const wasSignedIn = previous.status === AUTH_STATUS.AUTHENTICATED;
        const isSignedOut = state.status === AUTH_STATUS.UNAUTHENTICATED;
        const hasSwitchedRole =
          state.status === AUTH_STATUS.AUTHENTICATED && state.role !== previous.role;
        if (wasSignedIn && (isSignedOut || hasSwitchedRole)) queryClient.clear();
      }),
    [queryClient],
  );
}
