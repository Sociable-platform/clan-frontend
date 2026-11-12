import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { AUTH_STATUS } from '@/store';

import { useAuthSession } from '../../hooks/useAuthSession';

/** Renders the nested routes for a logged-in developer; everyone else goes to the login page. */
export function RequireAuth() {
  const { status } = useAuthSession();
  const location = useLocation();

  // Wait for the session restore so a reload on a protected page does not flash a redirect.
  if (status === AUTH_STATUS.INITIALIZING) return <p role="status">Loading…</p>;

  if (status === AUTH_STATUS.UNAUTHENTICATED) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={ROUTES.login} replace state={{ from }} />;
  }

  return <Outlet />;
}
