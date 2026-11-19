import { ROUTES } from '@/shared/config';
import { UserMenu } from '@/shared/ui/UserMenu';
import { AUTH_STATUS, ROLES } from '@/store';

import { useAuthSession } from '../../hooks/useAuthSession';
import { useLogout } from '../../hooks/useLogout';

/**
 * The account button at the end of the header, shown only while someone is signed in. Its menu
 * shows who you are and has Log out, and for a developer Your games, the way to the dashboard
 * from any page, and Invitations, the games other developers invited them to; for an admin Developers,
 * the admin panel's home. (The theme switch sits beside it and belongs to the app frame.)
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
          ...(role === ROLES.DEVELOPER
            ? [
                { key: 'games', label: 'Your games', icon: 'grid', to: ROUTES.games },
                { key: 'invitations', label: 'Invitations', icon: 'userPlus', to: ROUTES.invitations },
              ]
            : []),
          ...(role === ROLES.ADMIN
            ? [{ key: 'developers', label: 'Developers', icon: 'users', to: ROUTES.admin.developers }]
            : []),
          { key: 'logout', label: 'Log out', icon: 'logOut', onSelect: logout },
        ]}
      />
    );
  }

  // Signed out there is no account, so no account button: the landing page and the auth pages
  // have their own Log in and Register.
  return null;
}
