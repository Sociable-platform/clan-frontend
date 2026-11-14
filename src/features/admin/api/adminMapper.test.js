import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';
import {
  buildAdminDeveloper,
  buildAdminDeveloperDetail,
  buildAdminGame,
  buildAuditEntry,
} from '@/test/builders';

import {
  mapAdminDeveloper,
  mapAuditEntry,
  mapAuditPage,
  mapDeveloperPage,
  mapDeveloperSummary,
} from './adminMapper';

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

const RAW_GAME = {
  id: '3b0f1f0e-7c1d-4e53-9d2a-5b8e6a7c9d10',
  name: 'Farm Friends',
  description: 'Cozy farming game',
  status: 'active',
  statusReason: null,
  statusChangedAt: null,
  createdAt: '2026-11-07T08:30:00Z',
};

const RAW_DETAIL = {
  id: '6f1c1d1e-8a43-4d0e-9d57-0c2f0b1f6a10',
  email: 'dev@example.com',
  name: 'Dev One',
  status: 'active',
  statusReason: null,
  statusChangedAt: null,
  createdAt: '2026-11-06T10:00:00Z',
  games: [RAW_GAME],
};

describe('mapAdminDeveloper', () => {
  it('maps the developer and each game', () => {
    expect(mapAdminDeveloper(RAW_DETAIL)).toEqual(buildAdminDeveloperDetail());
  });

  it('keeps the reason and time of a suspension, for the developer and for a game', () => {
    const developer = mapAdminDeveloper({
      ...RAW_DETAIL,
      status: 'suspended',
      statusReason: 'non_payment',
      statusChangedAt: '2026-11-12T12:00:00Z',
      games: [{ ...RAW_GAME, status: 'suspended', statusReason: 'abuse', statusChangedAt: '2026-11-11T09:00:00Z' }],
    });

    expect(developer).toMatchObject({
      isSuspended: true,
      statusReason: 'non_payment',
      statusChangedAt: '2026-11-12T12:00:00Z',
    });
    expect(developer.games[0]).toEqual(
      buildAdminGame({
        status: 'suspended',
        isSuspended: true,
        statusReason: 'abuse',
        statusChangedAt: '2026-11-11T09:00:00Z',
      }),
    );
  });

  it('accepts a developer with no games', () => {
    expect(mapAdminDeveloper({ ...RAW_DETAIL, games: [] }).games).toEqual([]);
  });

  it('rejects a response without a games array', () => {
    expect(() => mapAdminDeveloper({ ...RAW_DETAIL, games: undefined })).toThrow(ApiError);
  });

  it('rejects a game with no ID', () => {
    expect(() => mapAdminDeveloper({ ...RAW_DETAIL, games: [{ name: 'x' }] })).toThrow(ApiError);
  });
});

describe('mapAuditEntry', () => {
  const RAW_ENTRY = {
    id: '9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d',
    actor: '0b7f6c52-3f64-4a53-b0a9-6d3c1c3f2a11',
    action: 'developer.suspended',
    targetType: 'developer',
    targetId: '6f1c1d1e-8a43-4d0e-9d57-0c2f0b1f6a10',
    reason: 'non_payment',
    note: 'Invoice 1042 unpaid after two reminders',
    createdAt: '2026-11-12T12:00:00Z',
  };

  it('maps an entry made by an admin', () => {
    expect(mapAuditEntry(RAW_ENTRY)).toEqual(buildAuditEntry());
  });

  it('recognises automation by the system: prefix', () => {
    expect(mapAuditEntry({ ...RAW_ENTRY, actor: 'system:billing' })).toMatchObject({
      actorId: 'system:billing',
      isSystemActor: true,
    });
  });

  it('turns a missing note into an empty string', () => {
    expect(mapAuditEntry({ ...RAW_ENTRY, note: null }).note).toBe('');
  });

  it('rejects an entry with no action', () => {
    expect(() => mapAuditEntry({ ...RAW_ENTRY, action: undefined })).toThrow(ApiError);
  });
});

describe('mapAuditPage', () => {
  it('returns the entries and the cursor', () => {
    const page = mapAuditPage({ entries: [], nextCursor: 'c1' });

    expect(page).toEqual({ entries: [], nextCursor: 'c1' });
  });

  it('rejects a page whose cursor is not a string or null', () => {
    expect(() => mapAuditPage({ entries: [], nextCursor: 5 })).toThrow(ApiError);
  });

  it('rejects a response without entries', () => {
    expect(() => mapAuditPage({ nextCursor: null })).toThrow(ApiError);
  });
});
