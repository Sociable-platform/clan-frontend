import { useState } from 'react';

import { refreshDeveloperProfile } from '../utils/refreshDeveloperProfile';

/** "Check again": refetches the developer's profile on request, so a resumed account unlocks without a reload. */
export function useRefreshDeveloper() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    setIsError(false);
    try {
      await refreshDeveloperProfile();
    } catch {
      setIsError(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refresh, isRefreshing, isError };
}
