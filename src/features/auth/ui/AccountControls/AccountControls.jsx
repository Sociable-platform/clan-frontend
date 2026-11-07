import { Link } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { AUTH_STATUS } from '@/store';

import { useAuthSession } from '../../hooks/useAuthSession';
import { useLogout } from '../../hooks/useLogout';

/** Header area: who is logged in plus Log out, or the Log in / Register links. */
export function AccountControls() {
  const { status, developer } = useAuthSession();
  const logout = useLogout();

  if (status === AUTH_STATUS.INITIALIZING) return null;

  if (status === AUTH_STATUS.AUTHENTICATED) {
    return (
      <div className="account-controls">
        <span className="account-name">{developer?.name || developer?.email}</span>
        <button type="button" className="button button-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="account-controls">
      <Link to={ROUTES.login}>Log in</Link>
      <Link to={ROUTES.register} className="button">
        Register
      </Link>
    </div>
  );
}
