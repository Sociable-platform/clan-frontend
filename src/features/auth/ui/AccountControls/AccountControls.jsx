import { ROUTES } from '@/shared/config';
import { UserMenu } from '@/shared/ui/UserMenu';
import { AUTH_STATUS } from '@/store';

import { useAuthSession } from '../../hooks/useAuthSession';
import { useLogout } from '../../hooks/useLogout';

/**
 * The account button at the end of the header. Signed in, its menu shows who you are and has
 * Log out; signed out, it offers Log in and Register. The theme choice is in the menu either way.
 */
export function AccountControls() {
  const { status, developer } = useAuthSession();
  const logout = useLogout();

  if (status === AUTH_STATUS.INITIALIZING) return null;

  if (status === AUTH_STATUS.AUTHENTICATED) {
    const name = developer?.name || developer?.email;
    return (
      <UserMenu
        accountLabel={name}
        accountDetail={developer?.name ? developer.email : null}
        items={[{ key: 'logout', label: 'Log out', icon: 'logOut', onSelect: logout }]}
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
