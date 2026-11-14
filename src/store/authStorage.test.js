import { beforeEach, describe, expect, it } from 'vitest';

import { clearStoredSession, readStoredSession, writeStoredSession } from './authStorage';

const KEY = 'clan.dashboard.session';
const FUTURE = () => Date.now() + 60_000;

describe('authStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps the role next to the token', () => {
    const expiresAt = FUTURE();
    writeStoredSession({ token: 'abc', expiresAt, role: 'admin' });

    expect(readStoredSession()).toEqual({ token: 'abc', expiresAt, role: 'admin' });
  });

  it('reads a session stored before roles existed as a developer session', () => {
    const expiresAt = FUTURE();
    window.localStorage.setItem(KEY, JSON.stringify({ token: 'old', expiresAt }));

    expect(readStoredSession()).toEqual({ token: 'old', expiresAt, role: 'developer' });
  });

  it('drops a session with an unknown role', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ token: 'abc', expiresAt: FUTURE(), role: 'root' }));

    expect(readStoredSession()).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('drops an expired session', () => {
    writeStoredSession({ token: 'abc', expiresAt: Date.now() - 1, role: 'admin' });

    expect(readStoredSession()).toBeNull();
  });

  it('drops a value that is not JSON', () => {
    window.localStorage.setItem(KEY, 'not json');

    expect(readStoredSession()).toBeNull();
  });

  it('clears the stored session', () => {
    writeStoredSession({ token: 'abc', expiresAt: FUTURE(), role: 'developer' });

    clearStoredSession();

    expect(readStoredSession()).toBeNull();
  });
});
