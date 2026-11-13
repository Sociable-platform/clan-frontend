import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';

import { buildAdmin, buildDeveloper } from '@/test/builders';

import { mapAdmin, mapDeveloper, mapLoginResponse } from './authMapper';

describe('mapLoginResponse', () => {
  it('turns expiresIn seconds into an absolute expiry in ms', () => {
    expect(mapLoginResponse({ token: 'abc', expiresIn: 86400 }, 1000)).toEqual({
      token: 'abc',
      expiresAt: 1000 + 86_400_000,
    });
  });

  it('rejects a response without a token', () => {
    expect(() => mapLoginResponse({ expiresIn: 5 })).toThrow(ApiError);
  });
});

describe('mapDeveloper', () => {
  it('keeps only the UI fields', () => {
    expect(mapDeveloper({ ...buildDeveloper(), extra: 'x' })).toEqual(buildDeveloper());
  });

  it('maps a suspended developer with the reason code', () => {
    const raw = { id: 'd1', email: 'a@b.c', status: 'suspended', statusReason: 'abuse', note: 'internal' };

    expect(mapDeveloper(raw)).toMatchObject({ status: 'suspended', isSuspended: true, statusReason: 'abuse' });
    expect(mapDeveloper(raw)).not.toHaveProperty('note');
  });

  it('counts a response with no status as active', () => {
    expect(mapDeveloper({ id: 'd1', email: 'a@b.c' })).toMatchObject({
      status: 'active',
      isSuspended: false,
      statusReason: null,
    });
  });
});

describe('mapAdmin', () => {
  it('keeps only the UI fields', () => {
    expect(mapAdmin({ ...buildAdmin(), passwordHash: 'secret' })).toEqual(buildAdmin());
  });

  it('rejects a response without an id', () => {
    expect(() => mapAdmin({ email: 'a@example.com' })).toThrow(ApiError);
  });
});
