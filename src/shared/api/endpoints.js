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
  games: {
    list: `${API_V1}/games`,
    create: `${API_V1}/games`,
    apiKeys: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/api-keys`,
    widgetDraft: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/widget/draft`,
  },
  apiKeys: {
    byId: (keyId) => `${API_V1}/api-keys/${encodeURIComponent(keyId)}`,
  },
};
