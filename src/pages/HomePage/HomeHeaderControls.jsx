import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link } from 'react-router-dom';

import { useAuthSession } from '@/features/auth';
import { ROUTES } from '@/shared/config';
import { HeaderSlot } from '@/shared/ui/AppLayout';
import { Icon } from '@/shared/ui/Icon';
import { AUTH_STATUS, ROLES } from '@/store';

import { HOME_SECTIONS } from './homeContent';

// The links that scroll to the page's two sections.
const SECTION_LINKS = [
  { key: 'steps', label: 'How it works', href: `#${HOME_SECTIONS.steps}` },
  { key: 'features', label: 'Features', href: `#${HOME_SECTIONS.features}` },
];

/**
 * What the landing page adds to the app header: links that scroll to its two sections, and the way
 * in. A visitor gets Log in and Create account; a signed-in developer gets Your games instead.
 * Nothing is shown while the session is still being read, so the buttons never flash and change,
 * and an admin gets no button: games belong to developers.
 *
 * On a wide screen all of it sits in the header. On a phone there is no room, so the same links
 * are in a menu behind one button at the end of the header; the stylesheet shows one or the other.
 */
export function HomeHeaderControls() {
  const { status, role } = useAuthSession();
  const isGuest = status === AUTH_STATUS.UNAUTHENTICATED;
  const isDeveloper = status === AUTH_STATUS.AUTHENTICATED && role === ROLES.DEVELOPER;

  // The way in, for whoever is looking: the buttons of the wide header and the items of the menu.
  let wayIn = [];
  if (isGuest) {
    wayIn = [
      { key: 'login', label: 'Log in', to: ROUTES.login, className: 'button button-secondary' },
      { key: 'register', label: 'Create account', to: ROUTES.register, className: 'button' },
    ];
  } else if (isDeveloper) {
    wayIn = [{ key: 'games', label: 'Your games', to: ROUTES.games, className: 'button' }];
  }

  return (
    <HeaderSlot>
      <div className="home-header">
        <nav aria-label="On this page" className="home-header-links">
          {SECTION_LINKS.map((link) => (
            <a key={link.key} href={link.href} className="app-nav-link">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="home-header-actions">
          {wayIn.map((item) => (
            <Link key={item.key} to={item.to} className={item.className}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Phones: everything above, behind one button. Radix handles the keyboard, focus and Escape. */}
        <div className="home-header-menu">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="header-icon-button" aria-label="Menu">
              <Icon name="menu" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={8} className="user-menu">
                {SECTION_LINKS.map((link) => (
                  <DropdownMenu.Item key={link.key} asChild>
                    <a href={link.href} className="user-menu-item">
                      {link.label}
                    </a>
                  </DropdownMenu.Item>
                ))}
                {wayIn.length > 0 ? <DropdownMenu.Separator className="user-menu-separator" /> : null}
                {wayIn.map((item) => (
                  <DropdownMenu.Item key={item.key} asChild>
                    <Link to={item.to} className="user-menu-item">
                      {item.label}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </HeaderSlot>
  );
}
