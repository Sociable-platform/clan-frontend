import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api';
import { sessionBridge } from '@/shared/api/session';
import { AUTH_STATUS, readStoredSession, ROLES, useAuthStore } from '@/store';
import { buildAdmin, buildDeveloper, buildSuspendedDeveloper } from '@/test/builders';

import { getCurrentAdmin, getCurrentDeveloper } from '../api/authApi';

import { useSessionInitializer } from './useSessionInitializer';

vi.mock('../api/authApi');

function storeSession(role) {
  window.localStorage.setItem(
    'clan.dashboard.session',
    JSON.stringify({ token: 'stored', expiresAt: Date.now() + 60_000, ...(role && { role }) }),
  );
}

describe('useSessionInitializer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('becomes unauthenticated without calling the backend when nothing is stored', () => {
    renderHook(() => useSessionInitializer());

    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED);
    expect(getCurrentDeveloper).not.toHaveBeenCalled();
  });

  it('restores a stored session through /me', async () => {
    storeSession();
    getCurrentDeveloper.mockResolvedValue(buildDeveloper());

    renderHook(() => useSessionInitializer());

    await waitFor(() => expect(useAuthStore.getState().status).toBe(AUTH_STATUS.AUTHENTICATED));
    expect(getCurrentDeveloper).toHaveBeenCalledWith(expect.objectContaining({ token: 'stored' }));
    expect(useAuthStore.getState().developer).toEqual(buildDeveloper());
  });

  it('restores a stored developer session through /developers/me when the role is stored', async () => {
    storeSession(ROLES.DEVELOPER);
    getCurrentDeveloper.mockResolvedValue(buildDeveloper());

    renderHook(() => useSessionInitializer());

    await waitFor(() => expect(useAuthStore.getState().status).toBe(AUTH_STATUS.AUTHENTICATED));
    expect(useAuthStore.getState().role).toBe(ROLES.DEVELOPER);
    expect(getCurrentAdmin).not.toHaveBeenCalled();
  });

  it('restores a stored admin session through /admin/me', async () => {
    storeSession(ROLES.ADMIN);
    getCurrentAdmin.mockResolvedValue(buildAdmin());

    renderHook(() => useSessionInitializer());

    await waitFor(() => expect(useAuthStore.getState().status).toBe(AUTH_STATUS.AUTHENTICATED));
    expect(getCurrentAdmin).toHaveBeenCalledWith(expect.objectContaining({ token: 'stored' }));
    expect(getCurrentDeveloper).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ role: ROLES.ADMIN, admin: buildAdmin(), developer: null });
  });

  it('drops an admin token the backend rejects', async () => {
    storeSession(ROLES.ADMIN);
    getCurrentAdmin.mockRejectedValue(new ApiError({ status: 401, code: 'unauthorized', message: 'No' }));

    renderHook(() => useSessionInitializer());

    await waitFor(() => expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED));
    expect(readStoredSession()).toBeNull();
  });

  it('drops a token the backend rejects', async () => {
    storeSession();
    getCurrentDeveloper.mockRejectedValue(new ApiError({ status: 401, code: 'unauthorized', message: 'No' }));

    renderHook(() => useSessionInitializer());

    await waitFor(() => expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED));
    expect(readStoredSession()).toBeNull();
  });

  it('keeps the stored token when the backend is unreachable', async () => {
    storeSession();
    getCurrentDeveloper.mockRejectedValue(new ApiError({ status: 0, code: 'network_error', message: 'Down' }));

    renderHook(() => useSessionInitializer());

    await waitFor(() => expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED));
    expect(readStoredSession()).not.toBeNull();
  });

  describe('when a write is refused because the account is suspended', () => {
    async function startSignedInDeveloper() {
      storeSession();
      getCurrentDeveloper.mockResolvedValueOnce(buildDeveloper());
      renderHook(() => useSessionInitializer());
      await waitFor(() => expect(useAuthStore.getState().status).toBe(AUTH_STATUS.AUTHENTICATED));
    }

    it('goes read-only at once, then learns the reason from /developers/me', async () => {
      await startSignedInDeveloper();
      getCurrentDeveloper.mockResolvedValueOnce(buildSuspendedDeveloper('abuse'));

      sessionBridge.onAccountSuspended(new ApiError({ status: 403, code: 'account_suspended', message: 'x' }));

      expect(useAuthStore.getState().developer.isSuspended).toBe(true);
      await waitFor(() => expect(useAuthStore.getState().developer.statusReason).toBe('abuse'));
    });

    it('fetches the profile once for a burst of refused requests', async () => {
      await startSignedInDeveloper();
      getCurrentDeveloper.mockResolvedValue(buildSuspendedDeveloper());

      sessionBridge.onAccountSuspended();
      sessionBridge.onAccountSuspended();
      sessionBridge.onAccountSuspended();

      await waitFor(() => expect(useAuthStore.getState().developer.statusReason).toBe('non_payment'));
      expect(getCurrentDeveloper).toHaveBeenCalledTimes(2); // the restore, then one refresh
    });

    it('stays read-only with no reason when the profile cannot be fetched', async () => {
      await startSignedInDeveloper();
      getCurrentDeveloper.mockRejectedValueOnce(new ApiError({ status: 0, code: 'network_error', message: 'Down' }));

      sessionBridge.onAccountSuspended();

      await waitFor(() => expect(getCurrentDeveloper).toHaveBeenCalledTimes(2));
      expect(useAuthStore.getState().developer).toMatchObject({ isSuspended: true, statusReason: null });
    });
  });
});
