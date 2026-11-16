import { describe, expect, it } from 'vitest';

import { buildAdmin, buildDeveloper, buildSuspendedDeveloper } from '@/test/builders';

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

  describe('renewToken', () => {
    it('replaces the token of a signed-in developer and keeps it out of storage', () => {
      const { startSession, renewToken } = useAuthStore.getState();
      startSession({ token: 'old', expiresAt: FUTURE(), developer: buildDeveloper() });

      expect(renewToken({ token: 'fresh', expiresAt: FUTURE() })).toBe(true);

      expect(useAuthStore.getState()).toMatchObject({ token: 'fresh', developer: buildDeveloper() });
      expect(readStoredSession()).toEqual({ role: ROLES.DEVELOPER });
    });

    it('does nothing when nobody is signed in or an admin is', () => {
      const { startSession, clearSession, renewToken } = useAuthStore.getState();
      clearSession();
      expect(renewToken({ token: 'fresh', expiresAt: FUTURE() })).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();

      startSession({ token: 'adm', expiresAt: FUTURE(), role: ROLES.ADMIN, admin: buildAdmin() });
      expect(renewToken({ token: 'fresh', expiresAt: FUTURE() })).toBe(false);
      expect(useAuthStore.getState().token).toBe('adm');
    });
  });

  describe('suspension', () => {
    it('marks the signed-in developer suspended and says it changed something', () => {
      const { startSession, markDeveloperSuspended } = useAuthStore.getState();
      startSession({ token: 't', expiresAt: FUTURE(), developer: buildDeveloper() });

      const changed = markDeveloperSuspended();

      expect(changed).toBe(true);
      expect(useAuthStore.getState().developer).toMatchObject({ status: 'suspended', isSuspended: true });
    });

    it('does nothing, and says so, when the developer is already suspended', () => {
      const { startSession, markDeveloperSuspended } = useAuthStore.getState();
      startSession({ token: 't', expiresAt: FUTURE(), developer: buildSuspendedDeveloper('abuse') });

      const changed = markDeveloperSuspended();

      expect(changed).toBe(false);
      expect(useAuthStore.getState().developer.statusReason).toBe('abuse');
    });

    it('does nothing for an admin session or when signed out', () => {
      const { startSession, clearSession, markDeveloperSuspended } = useAuthStore.getState();
      startSession({ token: 't', expiresAt: FUTURE(), role: ROLES.ADMIN, admin: buildAdmin() });
      expect(markDeveloperSuspended()).toBe(false);

      clearSession();
      expect(markDeveloperSuspended()).toBe(false);
      expect(useAuthStore.getState().developer).toBeNull();
    });

    it('replaces the profile with a fresh one, for example once the reason is known', () => {
      const { startSession, markDeveloperSuspended, setDeveloper } = useAuthStore.getState();
      startSession({ token: 't', expiresAt: FUTURE(), developer: buildDeveloper() });
      markDeveloperSuspended();

      setDeveloper(buildSuspendedDeveloper('non_payment'));

      expect(useAuthStore.getState().developer).toEqual(buildSuspendedDeveloper('non_payment'));
    });

    it('ignores a fresh profile when nobody is signed in', () => {
      useAuthStore.getState().clearSession();

      useAuthStore.getState().setDeveloper(buildDeveloper());

      expect(useAuthStore.getState().developer).toBeNull();
    });
  });
});
