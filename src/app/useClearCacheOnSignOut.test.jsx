import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createQueryClient } from '@/shared/api';
import { AUTH_STATUS, ROLES, useAuthStore } from '@/store';
import { buildAdmin, buildDeveloper } from '@/test/builders';

import { useClearCacheOnSignOut } from './useClearCacheOnSignOut';

function setup() {
  const queryClient = createQueryClient();
  queryClient.setQueryData(['games', 'list'], [{ id: 'g1' }]);
  useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer: buildDeveloper() });
  renderHook(() => useClearCacheOnSignOut(queryClient));
  return queryClient;
}

describe('useClearCacheOnSignOut', () => {
  it('empties the cache when the session ends', () => {
    const queryClient = setup();

    useAuthStore.getState().clearSession();

    expect(queryClient.getQueryData(['games', 'list'])).toBeUndefined();
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED);
  });

  it('keeps the cache while the developer stays signed in', () => {
    const queryClient = setup();

    useAuthStore.getState().startSession({ token: 't2', expiresAt: Date.now() + 60_000, developer: buildDeveloper() });

    expect(queryClient.getQueryData(['games', 'list'])).toEqual([{ id: 'g1' }]);
  });

  it('empties the cache when a developer logs in as admin without logging out first', () => {
    const queryClient = setup();

    useAuthStore
      .getState()
      .startSession({ token: 'a', expiresAt: Date.now() + 60_000, role: ROLES.ADMIN, admin: buildAdmin() });

    expect(queryClient.getQueryData(['games', 'list'])).toBeUndefined();
    expect(useAuthStore.getState().role).toBe(ROLES.ADMIN);
  });
});
