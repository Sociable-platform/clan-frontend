/** Clan roles the developer defines (`clan.roles`, docs/config-v1/README.md "Clan roles"), lowest power first. */
export const ROLE_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

// The same rules the schema gives a role title: no angle brackets and no URL.
export const ROLE_NAME_FORBIDDEN = /[<>]|https?:|www\.|\/\//i;

export const ROLE_MESSAGES = {
  NAME_EMPTY: 'Give the role a title.',
  NAME_TOO_LONG: (max) => `Use ${max} characters or fewer.`,
  NAME_FORBIDDEN: 'Use plain text: no angle brackets and no links.',
  TOO_MANY: (max) => `A game can have up to ${max} roles.`,
  OWNER_NOTE: 'The owner role always has every power.',
  LOWEST_NOTE: 'Nobody is below this role, so it cannot kick, promote or demote anyone.',
  REMOVE_NOTE: 'A member of a removed role moves to the role below it.',
};
