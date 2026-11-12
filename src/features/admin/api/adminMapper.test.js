import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';
import { buildAdminDeveloper } from '@/test/builders';

import { mapDeveloperPage, mapDeveloperSummary } from './adminMapper';

const RAW = {
  id: '6f1c1d1e-8a43-4d0e-9d57-0c2f0b1f6a10',
  email: 'dev@example.com',
  name: 'Dev One',
  status: 'active',
  gameCount: 2,
  createdAt: '2026-11-06T10:00:00Z',
};

describe('mapDeveloperSummary', () => {
  it('keeps the UI fields and drops the rest', () => {
    expect(mapDeveloperSummary({ ...RAW, passwordHash: 'secret' })).toEqual(buildAdminDeveloper());
  });

  it('flags a suspended developer', () => {
    expect(mapDeveloperSummary({ ...RAW, status: 'suspended' })).toMatchObject({
      status: 'suspended',
      isSuspended: true,
    });
  });

  it('keeps a status it does not know instead of rejecting the whole list', () => {
    expect(mapDeveloperSummary({ ...RAW, status: 'past_due' })).toMatchObject({
      status: 'past_due',
      isSuspended: false,
    });
  });

  it('turns a missing name into an empty string and a missing count into 0', () => {
    expect(mapDeveloperSummary({ ...RAW, name: undefined, gameCount: undefined })).toMatchObject({
      name: '',
      gameCount: 0,
    });
  });

  it('rejects a row without an id', () => {
    expect(() => mapDeveloperSummary({ ...RAW, id: undefined })).toThrow(ApiError);
  });
});

describe('mapDeveloperPage', () => {
  it('unwraps the envelope', () => {
    expect(mapDeveloperPage({ developers: [RAW], nextCursor: 'abc' })).toEqual({
      developers: [buildAdminDeveloper()],
      nextCursor: 'abc',
    });
  });

  it('keeps a null cursor on the last page', () => {
    expect(mapDeveloperPage({ developers: [], nextCursor: null })).toEqual({ developers: [], nextCursor: null });
  });

  it('rejects a page without a developers array', () => {
    expect(() => mapDeveloperPage({ nextCursor: null })).toThrow(ApiError);
  });

  it('rejects a page with no cursor field at all', () => {
    expect(() => mapDeveloperPage({ developers: [] })).toThrow(ApiError);
  });
});
