import { describe, expect, it } from 'vitest';

import { buildAdmin, buildDeveloper } from '@/test/builders';

import { readStoredSession } from './authStorage';
import { AUTH_STATUS, useAuthStore } from './authStore';
import { ROLES } from './roles';

const FUTURE = () => Date.now() + 60_000;

describe('auth store', () => {
  it('starts a developer session by default', () => {
    useAuthStore.getState().startSession({ token: 't', expiresAt: FUTURE(), developer: buildDeveloper() });

    expect(useAuthStore.getState()).toMatchObject({
      status: AUTH_STATUS.AUTHENTICATED,
      role: ROLES.DEVELOPER,
      developer: buildDeveloper(),
      admin: null,
    });
    expect(readStoredSession()).toMatchObject({ role: ROLES.DEVELOPER });
  });

  it('starts an admin session and stores the role', () => {
    useAuthStore.getState().startSession({ token: 't', expiresAt: FUTURE(), role: ROLES.ADMIN, admin: buildAdmin() });

    expect(useAuthStore.getState()).toMatchObject({ role: ROLES.ADMIN, admin: buildAdmin(), developer: null });
    expect(readStoredSession()).toMatchObject({ token: 't', role: ROLES.ADMIN });
  });

  it('logging in as admin replaces a developer session completely', () => {
    const { startSession } = useAuthStore.getState();
    startSession({ token: 'dev', expiresAt: FUTURE(), developer: buildDeveloper() });

    startSession({ token: 'adm', expiresAt: FUTURE(), role: ROLES.ADMIN, admin: buildAdmin() });

    expect(useAuthStore.getState()).toMatchObject({ token: 'adm', role: ROLES.ADMIN, developer: null });
    expect(readStoredSession()).toMatchObject({ token: 'adm', role: ROLES.ADMIN });
  });

  it('log out clears the role, the profile and the stored token', () => {
    const { startSession, clearSession } = useAuthStore.getState();
    startSession({ token: 'adm', expiresAt: FUTURE(), role: ROLES.ADMIN, admin: buildAdmin() });

    clearSession();

    expect(useAuthStore.getState()).toMatchObject({
      status: AUTH_STATUS.UNAUTHENTICATED,
      token: null,
      role: null,
      admin: null,
      developer: null,
    });
    expect(readStoredSession()).toBeNull();
  });
});
