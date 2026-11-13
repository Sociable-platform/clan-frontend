/** Query string for `GET /admin/audit-log`. `targetId` limits it to one developer or game. */
export function buildAuditLogQuery({ targetId = '', cursor = null } = {}) {
  const params = new URLSearchParams();
  if (targetId) params.set('targetId', targetId);
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return query ? `?${query}` : '';
}
