import { ROUTES } from '@/shared/config';
import { ROLES } from '@/store';

// Where each kind of session starts and where it signs in.
export const ROLE_HOME_PATH = {
  [ROLES.DEVELOPER]: ROUTES.games,
  [ROLES.ADMIN]: ROUTES.admin.developers,
};

export const ROLE_LOGIN_PATH = {
  [ROLES.DEVELOPER]: ROUTES.login,
  [ROLES.ADMIN]: ROUTES.admin.login,
};
