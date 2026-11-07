import { NavLink } from 'react-router-dom';

import { ROUTES } from '@/shared/config';

/** Log in / Register switch shown at the top of both auth cards. */
export function AuthTabs() {
  return (
    <nav className="auth-tabs" aria-label="Account">
      <NavLink to={ROUTES.login} className="auth-tab">
        Log in
      </NavLink>
      <NavLink to={ROUTES.register} className="auth-tab">
        Register
      </NavLink>
    </nav>
  );
}
