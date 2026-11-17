// A developer's role on a game (openapi/platform.yaml `GameMember.role`).
export const TEAM_ROLES = {
  OWNER: 'owner',
  MEMBER: 'member',
};

export const TEAM_ROLE_LABELS = {
  [TEAM_ROLES.OWNER]: 'Owner',
  [TEAM_ROLES.MEMBER]: 'Member',
};

// Backend error codes this feature gives a specific meaning (openapi/platform.yaml).
export const TEAM_ERROR_CODES = {
  GAME_NOT_FOUND: 'game_not_found',
  OWNER_REQUIRED: 'owner_required',
  LAST_OWNER: 'last_owner',
  ALREADY_MEMBER: 'already_member',
  ALREADY_OWNER: 'already_owner',
  MEMBER_NOT_FOUND: 'member_not_found',
  INVITE_NOT_FOUND: 'invite_not_found',
  INVALID_EMAIL: 'invalid_email',
  RATE_LIMITED: 'rate_limited',
};

// Same limit as RegisterRequest.email in openapi/platform.yaml.
export const TEAM_LIMITS = {
  EMAIL_MAX: 254,
};

export const TEAM_MESSAGES = {
  PAGE_LEAD: 'Everybody on a game can edit its widget and publish it. Only owners manage its API keys and its team.',
  MEMBERS_HEADING: 'Team',
  MEMBERS_ERROR_TITLE: 'Could not load the team',
  INVITES_HEADING: 'Pending invitations',
  INVITES_EMPTY_TITLE: 'No pending invitations',
  INVITES_EMPTY_MESSAGE: 'Invite a developer by email address. The invitation waits for them for 7 days.',
  INVITES_ERROR_TITLE: 'Could not load the invitations',
  GAME_NOT_FOUND_TITLE: 'Game not found',
  GAME_NOT_FOUND_MESSAGE: 'This game does not exist, or you are not on its team.',
  INVITE_HEADING: 'Invite a developer',
  INVITE_DESCRIPTION: 'They get an email. They can accept once they are signed in with an account that has this address.',
  INVITE_SUBMIT: 'Send invitation',
  INVITE_PENDING: 'Sending…',
  INVITE_SENT: 'Invitation sent.',
  EMAIL_REQUIRED: 'Enter an email address',
  EMAIL_INVALID: 'Enter a valid email address',
  EMAIL_TOO_LONG: `Use at most ${TEAM_LIMITS.EMAIL_MAX} characters`,
  ALREADY_MEMBER: 'This developer is already on the game.',
  RATE_LIMITED: 'Too many invitations were sent. Try again later.',
  OWNER_REQUIRED: 'Only the game’s owner can do this.',
  GENERIC_ERROR: 'Something went wrong. Try again.',
  CANCEL_INVITE: 'Cancel invitation',
  CANCEL_INVITE_ERROR: 'Could not cancel the invitation. Try again.',
  REMOVE_TITLE: 'Remove this developer from the game?',
  REMOVE_CONFIRM: 'Remove',
  REMOVE_ERROR: 'Could not remove the developer. Try again.',
  TRANSFER_TITLE: 'Make this developer the owner?',
  TRANSFER_CONFIRM: 'Transfer ownership',
  TRANSFER_ERROR: 'Could not transfer the game. Try again.',
  LEAVE_LABEL: 'Leave game',
  LEAVE_TITLE: 'Leave this game?',
  LEAVE_CONFIRM: 'Leave game',
  LEAVE_ERROR: 'Could not leave the game. Try again.',
  LAST_OWNER: 'A game needs at least one owner. Make another developer the owner first.',
  MEMBER_GONE: 'This developer is no longer on the game.',
  INVITE_GONE: 'This invitation no longer exists.',
};
