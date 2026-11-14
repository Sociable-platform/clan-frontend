import { useCallback, useState } from 'react';

import { ROLES, useAuthStore } from '@/store';

import { getCurrentAdmin, getCurrentDeveloper, loginAdmin, loginDeveloper } from '../api/authApi';

// Each role signs in at its own endpoint and asks its own `/me` who the token belongs to.
const SIGN_IN_BY_ROLE = {
  [ROLES.DEVELOPER]: { login: loginDeveloper, getProfile: getCurrentDeveloper, profileKey: 'developer' },
  [ROLES.ADMIN]: { login: loginAdmin, getProfile: getCurrentAdmin, profileKey: 'admin' },
};

/**
 * Logs in as `role` and starts the session, replacing any session of the other role. Rejects with
 * the `ApiError` so the form can show it. The token is passed explicitly to `/me` because the store
 * does not hold the session yet.
 */
export function useLoginMutation(role = ROLES.DEVELOPER) {
  const startSession = useAuthStore((state) => state.startSession);
  const [isPending, setIsPending] = useState(false);

  const login = useCallback(
    async (credentials) => {
      const { login: signIn, getProfile, profileKey } = SIGN_IN_BY_ROLE[role];
      setIsPending(true);
      try {
        const { token, expiresAt } = await signIn(credentials);
        const profile = await getProfile({ token });
        startSession({ token, expiresAt, role, [profileKey]: profile });
      } finally {
        setIsPending(false);
      }
    },
    [role, startSession],
  );

  return { login, isPending };
}
