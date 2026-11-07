import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { AUTH_STATUS } from '@/store';

import { useAuthSession } from '../../hooks/useAuthSession';
import { getSafeRedirectPath } from '../../utils/redirect';

/**
 * Renders login/register only for guests. A logged-in developer is sent on to the page
 * they were trying to reach (set by RequireAuth), or to Projects. This is also what
 * moves the browser after a successful login.
 */
export function GuestOnly() {
  const { status } = useAuthSession();
  const location = useLocation();

  if (status === AUTH_STATUS.INITIALIZING) return <p role="status">Loading…</p>;

  if (status === AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to={getSafeRedirectPath(location.state?.from, ROUTES.projects)} replace />;
  }

  return <Outlet />;
}
