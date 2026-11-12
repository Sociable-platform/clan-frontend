import arenaConfig from '../../docs/config-v1/examples/valid/arena.json';

export function buildDeveloper(overrides = {}) {
  return {
    id: '6f1c1d1e-8a43-4d0e-9d57-0c2f0b1f6a10',
    email: 'dev@example.com',
    name: 'Dev One',
    createdAt: '2026-11-06T10:00:00Z',
    ...overrides,
  };
}

export function buildAdmin(overrides = {}) {
  return {
    id: '2a9d4c5e-61a7-4c0a-9d3e-5b7c1f0a8e21',
    email: 'admin@example.com',
    name: 'Admin One',
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

/**
 * A valid widget config (the arena fixture of docs/config-v1, so it always matches the
 * contract). Pass a function to change the copy: `buildWidgetConfig((c) => { c.clan.maxMembers = 10; })`.
 */
export function buildWidgetConfig(change) {
  const config = structuredClone(arenaConfig);
  change?.(config);
  return config;
}

/**
 * A published widget version as the mapper returns it. `version` can be a number or an object
 * of overrides; the config defaults to the valid arena config.
 */
export function buildWidgetVersion(overrides = {}) {
  const version = overrides.version ?? 1;
  return {
    version,
    publishedAt: `2026-11-0${Math.min(version, 9)}T12:00:00Z`,
    publishedBy: '5c0e7d9a-3b6f-4c58-9a21-1d8e4f7b2a60',
    config: buildWidgetConfig(),
    ...overrides,
  };
}

/** A version without its config, as the history list returns it. */
export function buildWidgetVersionSummary(overrides = {}) {
  const { config: _config, ...summary } = buildWidgetVersion(overrides);
  return summary;
}
