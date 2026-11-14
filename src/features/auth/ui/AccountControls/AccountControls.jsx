import { ROUTES } from '@/shared/config';
import { UserMenu } from '@/shared/ui/UserMenu';
import { AUTH_STATUS, ROLES } from '@/store';

import { useAuthSession } from '../../hooks/useAuthSession';
import { useLogout } from '../../hooks/useLogout';

/**
 * The account button at the end of the header. Signed in, its menu shows who you are and has
 * Log out, and for a developer Your games, the way to the dashboard from any page; signed out,
 * it offers Log in and Register. The theme choice is in the menu either way.
 */
export function AccountControls() {
  const { status, role, developer, admin } = useAuthSession();
  const logout = useLogout();

  if (status === AUTH_STATUS.INITIALIZING) return null;

  if (status === AUTH_STATUS.AUTHENTICATED) {
    const account = role === ROLES.ADMIN ? admin : developer;
    const name = account?.name || account?.email;
    return (
      <UserMenu
        accountLabel={name}
        accountDetail={account?.name ? account.email : null}
        items={[
          ...(role === ROLES.DEVELOPER ? [{ key: 'games', label: 'Your games', icon: 'grid', to: ROUTES.games }] : []),
          { key: 'logout', label: 'Log out', icon: 'logOut', onSelect: logout },
        ]}
      />
    );
  }

  return (
    <UserMenu
      items={[
        { key: 'login', label: 'Log in', icon: 'logIn', to: ROUTES.login },
        { key: 'register', label: 'Register', icon: 'userPlus', to: ROUTES.register },
      ]}
    />
  );
}
