import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AUTH_STATUS } from '@/store';

import { ROLE_LOGIN_PATH } from '../../config/roleRoutes';
import { useAuthSession } from '../../hooks/useAuthSession';

/**
 * Renders the nested routes only for a session of `role`.
 *
 * - Default: anyone else is sent to that role's login page, remembering where they were going.
 * - `stealth`: anyone else gets `notFound` in place of the page and the URL stays, so a guest or a
 *   developer cannot tell that `/admin` exists. The caller passes the 404 element because a
 *   feature cannot import a page.
 */
export function RequireRole({ role, stealth = false, notFound = null }) {
  const { status, role: sessionRole } = useAuthSession();
  const location = useLocation();

  // Wait for the session restore so a reload on a protected page does not flash a 404 or a redirect.
  if (status === AUTH_STATUS.INITIALIZING) return <p role="status">Loading…</p>;

  const isAllowed = status === AUTH_STATUS.AUTHENTICATED && sessionRole === role;
  if (isAllowed) return <Outlet />;

  if (stealth) return notFound;

  const from = `${location.pathname}${location.search}${location.hash}`;
  return <Navigate to={ROLE_LOGIN_PATH[role]} replace state={{ from }} />;
}
