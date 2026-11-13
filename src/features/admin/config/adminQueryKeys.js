// Rooted at `all` so one invalidation refreshes every admin query (a status change in TEAM-204).
export const ADMIN_QUERY_KEYS = {
  all: ['admin'],
  developers: (filters) => [...ADMIN_QUERY_KEYS.all, 'developers', filters],
  developer: (developerId) => [...ADMIN_QUERY_KEYS.all, 'developer', developerId],
  auditLog: (targetId) => [...ADMIN_QUERY_KEYS.all, 'audit-log', targetId],
};
