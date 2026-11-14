/**
 * Query string for `GET /admin/developers`. Blank search and "All statuses" send no parameter, and
 * the search is trimmed, so the same filters always make the same URL (and the same cache key).
 */
export function buildDevelopersQuery({ q = '', status = '', cursor = null } = {}) {
  const params = new URLSearchParams();
  const search = q.trim();
  if (search) params.set('q', search);
  if (status) params.set('status', status);
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return query ? `?${query}` : '';
}
