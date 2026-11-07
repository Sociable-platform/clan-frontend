export function buildDeveloper(overrides = {}) {
  return {
    id: '6f1c1d1e-8a43-4d0e-9d57-0c2f0b1f6a10',
    email: 'dev@example.com',
    name: 'Dev One',
    createdAt: '2026-11-06T10:00:00Z',
    ...overrides,
  };
}

export function buildGame(overrides = {}) {
  return {
    id: '0d6f2c0e-5b1a-4f5e-8f55-2f4f0c7a9b11',
    name: 'Space Raiders',
    description: 'Browser shooter, 2 to 4 players',
    createdAt: '2026-11-07T09:30:00Z',
    ...overrides,
  };
}

/** UI shape of an API key as the mapper returns it (no full key). */
export function buildApiKey(overrides = {}) {
  return {
    id: '3b1c6f0e-9d2a-4a53-8f0b-7a9d2f6c1e44',
    gameId: '0d6f2c0e-5b1a-4f5e-8f55-2f4f0c7a9b11',
    keyPrefix: 'clk_Ab3x',
    createdAt: '2026-11-07T10:00:00Z',
    revokedAt: null,
    isRevoked: false,
    ...overrides,
  };
}

/** A freshly created key: the same row plus the one-time full key. */
export function buildNewApiKey(overrides = {}) {
  return { ...buildApiKey(), key: 'clk_Ab3xQ0m7w2n5v8k1p4s9d6f3g0h7j2l5z8c1x4b7n0m', ...overrides };
}
