import { Link } from 'react-router-dom';

import { useAuthSession } from '@/features/auth';
import { ROUTES } from '@/shared/config';
import { HeaderSlot } from '@/shared/ui/AppLayout';
import { AUTH_STATUS, ROLES } from '@/store';

import { HOME_SECTIONS } from './homeContent';

/**
 * What the landing page adds to the app header: links that scroll to its two sections, and the way
 * in. A visitor gets Log in and Create account; a signed-in developer gets Your games instead.
 * Nothing is shown while the session is still being read, so the buttons never flash and change,
 * and an admin gets no button: games belong to developers.
 */
export function HomeHeaderControls() {
  const { status, role } = useAuthSession();
  const isGuest = status === AUTH_STATUS.UNAUTHENTICATED;
  const isDeveloper = status === AUTH_STATUS.AUTHENTICATED && role === ROLES.DEVELOPER;

  return (
    <HeaderSlot>
      <div className="home-header">
        <nav aria-label="On this page" className="home-header-links">
          <a href={`#${HOME_SECTIONS.steps}`} className="app-nav-link">
            How it works
          </a>
          <a href={`#${HOME_SECTIONS.features}`} className="app-nav-link">
            Features
          </a>
        </nav>
        <div className="home-header-actions">
          {isGuest ? (
            <>
              <Link to={ROUTES.login} className="button button-secondary">
                Log in
              </Link>
              <Link to={ROUTES.register} className="button">
                Create account
              </Link>
            </>
          ) : null}
          {isDeveloper ? (
            <Link to={ROUTES.games} className="button">
              Your games
            </Link>
          ) : null}
        </div>
      </div>
    </HeaderSlot>
  );
}
