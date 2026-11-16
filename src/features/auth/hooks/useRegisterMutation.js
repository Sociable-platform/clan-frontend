import { useCallback, useState } from 'react';

import { registerDeveloper } from '../api/authApi';

/**
 * Registers. Registering does not log in. Resolves to `{ needsVerification }`: true when the
 * backend emailed a code and the account is created only once it is entered. Rejects with the
 * `ApiError`.
 */
export function useRegisterMutation() {
  const [isPending, setIsPending] = useState(false);

  const register = useCallback(async (values) => {
    setIsPending(true);
    try {
      return await registerDeveloper(values);
    } finally {
      setIsPending(false);
    }
  }, []);

  return { register, isPending };
}
