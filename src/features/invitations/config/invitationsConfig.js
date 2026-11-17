// Backend error codes this feature gives a specific meaning (openapi/platform.yaml).
export const INVITATIONS_ERROR_CODES = {
  INVITE_NOT_FOUND: 'invite_not_found',
  INVITE_EXPIRED: 'invite_expired',
};

export const INVITATIONS_MESSAGES = {
  PAGE_TITLE: 'Invitations',
  PAGE_LEAD: 'Owners of other games invited you to work on them. Accept to join the team, or decline.',
  LIST_ERROR_TITLE: 'Could not load your invitations',
  LIST_EMPTY_TITLE: 'No invitations',
  LIST_EMPTY_MESSAGE:
    'When an owner invites the email address of your account to a game, the invitation waits here for 7 days.',
  ACCEPT: 'Accept',
  DECLINE: 'Decline',
  GENERIC_ERROR: 'Something went wrong. Try again.',
  INVITE_GONE: 'This invitation is no longer available. The owner may have taken it back.',
  INVITE_EXPIRED: 'This invitation has expired. Ask the game’s owner to send a new one.',
};
