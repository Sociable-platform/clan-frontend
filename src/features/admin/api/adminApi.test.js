import { beforeEach, describe, expect, it, vi } from 'vitest';

import { platformClient } from '@/shared/api';

import {
  getAdminDeveloper,
  listAdminAuditLog,
  listAdminDevelopers,
  setAdminDeveloperStatus,
  setAdminGameStatus,
} from './adminApi';

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  platformClient: { get: vi.fn(), put: vi.fn() },
}));

describe('listAdminDevelopers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    platformClient.get.mockResolvedValue({ developers: [], nextCursor: null });
  });

  it('asks for the first page with no query string', async () => {
    const signal = new AbortController().signal;

    const page = await listAdminDevelopers({ signal });

    expect(platformClient.get).toHaveBeenCalledWith('/api/v1/admin/developers', { signal });
    expect(page).toEqual({ developers: [], nextCursor: null });
  });

  it('sends the filters and the cursor', async () => {
    await listAdminDevelopers({ q: 'ann', status: 'suspended', cursor: 'c1' });

    expect(platformClient.get).toHaveBeenCalledWith(
      '/api/v1/admin/developers?q=ann&status=suspended&cursor=c1',
      expect.anything(),
    );
  });
});

describe('getAdminDeveloper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('gets the developer by ID and maps the response', async () => {
    const signal = new AbortController().signal;
    platformClient.get.mockResolvedValue({
      id: 'd1',
      email: 'dev@example.com',
      name: 'Dev One',
      status: 'suspended',
      statusReason: 'abuse',
      statusChangedAt: '2026-11-12T12:00:00Z',
      createdAt: '2026-11-06T10:00:00Z',
      games: [],
    });

    const developer = await getAdminDeveloper({ developerId: 'd1', signal });

    expect(platformClient.get).toHaveBeenCalledWith('/api/v1/admin/developers/d1', { signal });
    expect(developer).toMatchObject({ id: 'd1', isSuspended: true, statusReason: 'abuse', games: [] });
  });

  it('encodes the ID so it cannot change the path', async () => {
    platformClient.get.mockResolvedValue({ id: 'x', email: 'a@b.c', status: 'active', games: [] });

    await getAdminDeveloper({ developerId: '../me' });

    expect(platformClient.get).toHaveBeenCalledWith('/api/v1/admin/developers/..%2Fme', expect.anything());
  });
});

describe('listAdminAuditLog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    platformClient.get.mockResolvedValue({ entries: [], nextCursor: null });
  });

  it('asks for the entries about one target', async () => {
    const signal = new AbortController().signal;

    const page = await listAdminAuditLog({ targetId: 'd1', signal });

    expect(platformClient.get).toHaveBeenCalledWith('/api/v1/admin/audit-log?targetId=d1', { signal });
    expect(page).toEqual({ entries: [], nextCursor: null });
  });

  it('sends the cursor for the next page', async () => {
    await listAdminAuditLog({ targetId: 'd1', cursor: 'c2' });

    expect(platformClient.get).toHaveBeenCalledWith(
      '/api/v1/admin/audit-log?targetId=d1&cursor=c2',
      expect.anything(),
    );
  });
});

describe('setAdminDeveloperStatus', () => {
  const RAW_DEVELOPER = {
    id: 'd1',
    email: 'dev@example.com',
    name: 'Dev One',
    status: 'suspended',
    statusReason: 'abuse',
    statusChangedAt: '2026-11-12T12:00:00Z',
    createdAt: '2026-11-06T10:00:00Z',
    games: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    platformClient.put.mockResolvedValue(RAW_DEVELOPER);
  });

  it('suspends with the reason and note and returns the mapped developer', async () => {
    const developer = await setAdminDeveloperStatus({
      developerId: 'd1',
      status: 'suspended',
      reason: 'abuse',
      note: 'spam',
    });

    expect(platformClient.put).toHaveBeenCalledWith(
      '/api/v1/admin/developers/d1/status',
      { status: 'suspended', reason: 'abuse', note: 'spam' },
      expect.anything(),
    );
    expect(developer).toMatchObject({ id: 'd1', isSuspended: true, statusReason: 'abuse' });
  });

  it('resumes with the status alone', async () => {
    await setAdminDeveloperStatus({ developerId: 'd1', status: 'active' });

    expect(platformClient.put).toHaveBeenCalledWith(
      '/api/v1/admin/developers/d1/status',
      { status: 'active' },
      expect.anything(),
    );
  });
});

describe('setAdminGameStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    platformClient.put.mockResolvedValue({
      id: 'g1',
      name: 'Farm Friends',
      description: '',
      status: 'suspended',
      statusReason: 'non_payment',
      statusChangedAt: '2026-11-12T12:00:00Z',
      createdAt: '2026-11-07T08:30:00Z',
    });
  });

  it('suspends one game and returns the mapped game', async () => {
    const game = await setAdminGameStatus({ gameId: 'g1', status: 'suspended', reason: 'non_payment' });

    expect(platformClient.put).toHaveBeenCalledWith(
      '/api/v1/admin/games/g1/status',
      { status: 'suspended', reason: 'non_payment' },
      expect.anything(),
    );
    expect(game).toMatchObject({ id: 'g1', isSuspended: true, statusReason: 'non_payment' });
  });

  it('encodes the ID so it cannot change the path', async () => {
    await setAdminGameStatus({ gameId: '../x', status: 'active' });

    expect(platformClient.put).toHaveBeenCalledWith(
      '/api/v1/admin/games/..%2Fx/status',
      { status: 'active' },
      expect.anything(),
    );
  });
});
