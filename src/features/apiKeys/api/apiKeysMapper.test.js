import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';

import { mapApiKey, mapApiKeyList, mapNewApiKey } from './apiKeysMapper';

const RAW_KEY = {
  id: '3b1c6f0e-9d2a-4a53-8f0b-7a9d2f6c1e44',
  gameId: '0d6f2c0e-5b1a-4f5e-8f55-2f4f0c7a9b11',
  keyPrefix: 'clk_Ab3x',
  createdAt: '2026-11-07T10:00:00Z',
  revokedAt: null,
};

describe('apiKeysMapper', () => {
  it('marks a key with no revokedAt as active', () => {
    expect(mapApiKey(RAW_KEY)).toMatchObject({ isRevoked: false, revokedAt: null });
  });

  it('marks a key with a revokedAt as revoked', () => {
    const revoked = mapApiKey({ ...RAW_KEY, revokedAt: '2026-11-08T08:00:00Z' });
    expect(revoked).toMatchObject({ isRevoked: true, revokedAt: '2026-11-08T08:00:00Z' });
  });

  it('unwraps the list envelope into a plain array', () => {
    expect(mapApiKeyList({ apiKeys: [RAW_KEY] })).toHaveLength(1);
  });

  it('keeps the one-time key on a newly created key only', () => {
    expect(mapNewApiKey({ ...RAW_KEY, key: 'clk_secret' }).key).toBe('clk_secret');
    expect(mapApiKey({ ...RAW_KEY, key: 'clk_secret' })).not.toHaveProperty('key');
  });

  it('rejects malformed responses', () => {
    expect(() => mapApiKeyList({})).toThrow(ApiError);
    expect(() => mapNewApiKey(RAW_KEY)).toThrow(ApiError);
  });
});
