// Every Platform API path lives here (clan-backend/openapi/platform.yaml).
// Call sites import these builders instead of hardcoding strings.
const API_V1 = '/api/v1';

export const ENDPOINTS = {
  health: '/health',
  ready: '/ready',
  developers: {
    register: `${API_V1}/developers/register`,
    registerVerify: `${API_V1}/developers/register/verify`,
    registerResend: `${API_V1}/developers/register/resend`,
    login: `${API_V1}/developers/login`,
    tokenRefresh: `${API_V1}/developers/token/refresh`,
    logout: `${API_V1}/developers/logout`,
    passwordReset: `${API_V1}/developers/password-reset`,
    passwordResetConfirm: `${API_V1}/developers/password-reset/confirm`,
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
    // The team of a game (TEAM-306..308): who is on it, invitations, handing it over, leaving it.
    members: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/members`,
    member: (gameId, developerId) =>
      `${API_V1}/games/${encodeURIComponent(gameId)}/members/${encodeURIComponent(developerId)}`,
    invites: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/invites`,
    invite: (gameId, inviteId) =>
      `${API_V1}/games/${encodeURIComponent(gameId)}/invites/${encodeURIComponent(inviteId)}`,
    transferOwnership: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/transfer-ownership`,
    leave: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/leave`,
    widgetDraft: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/widget/draft`,
    widgetPublish: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/widget/publish`,
    widgetVersions: (gameId) => `${API_V1}/games/${encodeURIComponent(gameId)}/widget/versions`,
    widgetVersion: (gameId, version) =>
      `${API_V1}/games/${encodeURIComponent(gameId)}/widget/versions/${encodeURIComponent(version)}`,
    widgetRollback: (gameId, version) =>
      `${API_V1}/games/${encodeURIComponent(gameId)}/widget/versions/${encodeURIComponent(version)}/rollback`,
  },
  // The invitations sent to the signed-in developer's email address.
  invites: {
    list: `${API_V1}/invites`,
    accept: (inviteId) => `${API_V1}/invites/${encodeURIComponent(inviteId)}/accept`,
    decline: (inviteId) => `${API_V1}/invites/${encodeURIComponent(inviteId)}/decline`,
  },
  apiKeys: {
    byId: (keyId) => `${API_V1}/api-keys/${encodeURIComponent(keyId)}`,
  },
};
