import { useCallback, useState } from 'react';

import { registerDeveloper } from '../api/authApi';

/** Creates the account. Registering does not log in. Rejects with the `ApiError`. */
export function useRegisterMutation() {
  const [isPending, setIsPending] = useState(false);

  const register = useCallback(async (values) => {
    setIsPending(true);
    try {
      await registerDeveloper(values);
    } finally {
      setIsPending(false);
    }
  }, []);

  return { register, isPending };
}
