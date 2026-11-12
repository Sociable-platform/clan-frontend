import { useEffect } from 'react';

import { AUTH_STATUS, useAuthStore } from '@/store';

/**
 * Empties the server-state cache when the session ends (log out or an expired token), so
 * the next developer on this browser never sees the previous one's games or keys.
 */
export function useClearCacheOnSignOut(queryClient) {
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        const wasSignedIn = previous.status === AUTH_STATUS.AUTHENTICATED;
        if (wasSignedIn && state.status === AUTH_STATUS.UNAUTHENTICATED) queryClient.clear();
      }),
    [queryClient],
  );
}
