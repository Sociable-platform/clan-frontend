import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api';
import { sessionBridge } from '@/shared/api/session';
import { AUTH_STATUS, readStoredSession, ROLES, useAuthStore } from '@/store';
import { buildAdmin, buildDeveloper, buildSuspendedDeveloper } from '@/test/builders';

import { getCurrentAdmin, getCurrentDeveloper, refreshDeveloperSession } from '../api/authApi';

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

  describe('when the HTTP client asks for a new token', () => {
    async function startSignedIn(role) {
      storeSession(role);
      getCurrentDeveloper.mockResolvedValueOnce(buildDeveloper());
      getCurrentAdmin.mockResolvedValueOnce(buildAdmin());
      renderHook(() => useSessionInitializer());
      await waitFor(() => expect(useAuthStore.getState().status).toBe(AUTH_STATUS.AUTHENTICATED));
    }

    it('continues a developer session with the refresh cookie and keeps the new token', async () => {
      await startSignedIn(ROLES.DEVELOPER);
      refreshDeveloperSession.mockResolvedValue({ token: 'fresh', expiresAt: Date.now() + 60_000 });

      await expect(sessionBridge.refreshToken()).resolves.toBe('fresh');

      expect(useAuthStore.getState().token).toBe('fresh');
      expect(useAuthStore.getState().developer).toEqual(buildDeveloper());
      expect(sessionBridge.getToken()).toBe('fresh');
    });

    it('says the session is over when the server refuses the refresh', async () => {
      await startSignedIn(ROLES.DEVELOPER);
      refreshDeveloperSession.mockRejectedValue(
        new ApiError({ status: 401, code: 'invalid_refresh_token', message: 'Your session has ended.' }),
      );

      await expect(sessionBridge.refreshToken()).resolves.toBeNull();
    });

    it('says the session is over when the backend has no refresh endpoint', async () => {
      await startSignedIn(ROLES.DEVELOPER);
      refreshDeveloperSession.mockRejectedValue(new ApiError({ status: 404, code: 'not_found', message: 'No' }));

      await expect(sessionBridge.refreshToken()).resolves.toBeNull();
    });

    it('does not judge the session when the server cannot be reached', async () => {
      await startSignedIn(ROLES.DEVELOPER);
      refreshDeveloperSession.mockRejectedValue(new ApiError({ status: 0, code: 'network_error', message: 'Down' }));

      await expect(sessionBridge.refreshToken()).rejects.toBeInstanceOf(ApiError);
      expect(useAuthStore.getState().status).toBe(AUTH_STATUS.AUTHENTICATED);
    });

    it('drops a new token that arrives after the developer logged out', async () => {
      await startSignedIn(ROLES.DEVELOPER);
      refreshDeveloperSession.mockImplementation(async () => {
        useAuthStore.getState().clearSession();
        return { token: 'late', expiresAt: Date.now() + 60_000 };
      });

      await expect(sessionBridge.refreshToken()).resolves.toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('never refreshes an admin session', async () => {
      await startSignedIn(ROLES.ADMIN);

      await expect(sessionBridge.refreshToken()).resolves.toBeNull();
      expect(refreshDeveloperSession).not.toHaveBeenCalled();
    });
  });
});
