import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AUTH_STATUS, ROLES } from '@/store';

import { ROLE_HOME_PATH } from '../../config/roleRoutes';
import { useAuthSession } from '../../hooks/useAuthSession';
import { getSafeRedirectPath } from '../../utils/redirect';

/**
 * Renders a login/register page only for people who are not signed in as `role`. Someone already
 * signed in as `role` is sent on to the page they were trying to reach (set by RequireAuth), or to
 * that role's home. This is also what moves the browser after a successful login.
 *
 * A session of the other role does not count: a developer can open `/admin/login`, and logging in
 * there replaces their session (and the other way round).
 */
export function GuestOnly({ role = ROLES.DEVELOPER }) {
  const { status, role: sessionRole } = useAuthSession();
  const location = useLocation();

  if (status === AUTH_STATUS.INITIALIZING) return <p role="status">Loading…</p>;

  if (status === AUTH_STATUS.AUTHENTICATED && sessionRole === role) {
    return <Navigate to={getSafeRedirectPath(location.state?.from, ROLE_HOME_PATH[role])} replace />;
  }

  return <Outlet />;
}
