// Every Platform API path lives here (clan-backend/openapi/platform.yaml).
// Call sites import these builders instead of hardcoding strings.
const API_V1 = '/api/v1';

export const ENDPOINTS = {
  health: '/health',
  ready: '/ready',
  developers: {
    register: `${API_V1}/developers/register`,
    login: `${API_V1}/developers/login`,
    me: `${API_V1}/developers/me`,
  },
  admin: {
    login: `${API_V1}/admin/login`,
    me: `${API_V1}/admin/me`,
    developers: `${API_V1}/admin/developers`,
    developer: (developerId) => `${API_V1}/admin/developers/${encodeURIComponent(developerId)}`,
    developerStatus: (developerId) =>
      `${API_V1}/admin/developers/${encodeURIComponent(developerId)}/status`,
    gameStatus: (gameId) => `${API_V1}/admin/games/${encodeURIComponent(gameId)}/status`,
    auditLog: `${API_V1}/admin/audit-log`,
  },
  games: {
    list: `${API_V1}/games`,
    create: `${API_V1}/games`,
    apiKeys: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/api-keys`,
    widgetDraft: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/widget/draft`,
    widgetPublish: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/widget/publish`,
    widgetVersions: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/widget/versions`,
    widgetVersion: (gameId, version) =>
      `${API_V1}/games/${encodeURIComponent(gameId)}/widget/versions/${encodeURIComponent(version)}`,
    widgetRollback: (gameId, version) =>
      `${API_V1}/games/${encodeURIComponent(gameId)}/widget/versions/${encodeURIComponent(version)}/rollback`,
  },
  apiKeys: {
    byId: (keyId) => `${API_V1}/api-keys/${encodeURIComponent(keyId)}`,
  },
};
