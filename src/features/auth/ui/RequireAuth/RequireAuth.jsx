import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { AUTH_STATUS, ROLES } from '@/store';

import { ROLE_HOME_PATH } from '../../config/roleRoutes';
import { useAuthSession } from '../../hooks/useAuthSession';

/**
 * Renders the nested routes for a logged-in developer; guests go to the login page. Someone signed
 * in as an admin is not a developer, so they are sent to the admin home instead of a page whose
 * requests would all be refused.
 */
export function RequireAuth() {
  const { status, role } = useAuthSession();
  const location = useLocation();

  // Wait for the session restore so a reload on a protected page does not flash a redirect.
  if (status === AUTH_STATUS.INITIALIZING) return <p role="status">Loading…</p>;

  if (status === AUTH_STATUS.UNAUTHENTICATED) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={ROUTES.login} replace state={{ from }} />;
  }

  if (role !== ROLES.DEVELOPER) return <Navigate to={ROLE_HOME_PATH[role]} replace />;

  return <Outlet />;
}
