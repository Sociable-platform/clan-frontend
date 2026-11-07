import { useCallback, useState } from 'react';

import { useAuthStore } from '@/store';

import { getCurrentDeveloper, loginDeveloper } from '../api/authApi';

/**
 * Logs in and starts the session. Rejects with the `ApiError` so the form can
 * show it. The token is passed explicitly to `/me` because the store does not
 * hold the session yet.
 */
export function useLoginMutation() {
  const startSession = useAuthStore((state) => state.startSession);
  const [isPending, setIsPending] = useState(false);

  const login = useCallback(
    async (credentials) => {
      setIsPending(true);
      try {
        const { token, expiresAt } = await loginDeveloper(credentials);
        const developer = await getCurrentDeveloper({ token });
        startSession({ token, expiresAt, developer });
      } finally {
        setIsPending(false);
      }
    },
    [startSession],
  );

  return { login, isPending };
}
