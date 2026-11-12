// Who is signed in. One session at a time: logging in as one role replaces the other.
export const ROLES = {
  DEVELOPER: 'developer',
  ADMIN: 'admin',
};

export function isRole(value) {
  return Object.values(ROLES).includes(value);
}
