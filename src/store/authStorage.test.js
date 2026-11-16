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

  it('keeps only a marker for a developer session, never the token', () => {
    writeStoredSession({ token: 'secret', expiresAt: FUTURE(), role: 'developer' });

    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify({ role: 'developer' }));
    expect(readStoredSession()).toEqual({ role: 'developer' });
  });

  it.each([
    ['before roles existed', { token: 'old', expiresAt: FUTURE() }],
    ['with its token, by an older version', { token: 'old', expiresAt: FUTURE(), role: 'developer' }],
    ['with a token that has expired', { token: 'old', expiresAt: Date.now() - 1, role: 'developer' }],
  ])('reads a developer session stored %s as a marker and removes the token', (_case, stored) => {
    window.localStorage.setItem(KEY, JSON.stringify(stored));

    expect(readStoredSession()).toEqual({ role: 'developer' });
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify({ role: 'developer' }));
  });

  it('drops a session with an unknown role', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ token: 'abc', expiresAt: FUTURE(), role: 'root' }));

    expect(readStoredSession()).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('drops an expired admin session', () => {
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
