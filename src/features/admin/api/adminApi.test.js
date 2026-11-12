import { beforeEach, describe, expect, it, vi } from 'vitest';

import { platformClient } from '@/shared/api';

import { listAdminDevelopers } from './adminApi';

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal()),
  platformClient: { get: vi.fn() },
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
