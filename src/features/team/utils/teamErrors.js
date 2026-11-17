import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { TEAM_ERROR_CODES, TEAM_MESSAGES } from '../config/teamConfig';

/**
 * What to tell the person when a team action failed. A 403 `owner_required` (a member tried an owner
 * action, or lost the role since the page loaded) gets its own clear sentence; so do the rules of the
 * team. Anything else is the `fallback` of the action, or the network error's own text.
 */
export function describeTeamError(error, fallback = TEAM_MESSAGES.GENERIC_ERROR) {
  if (!(error instanceof ApiError)) return fallback;
  switch (error.code) {
    case TEAM_ERROR_CODES.OWNER_REQUIRED:
      return TEAM_MESSAGES.OWNER_REQUIRED;
    case TEAM_ERROR_CODES.LAST_OWNER:
      return TEAM_MESSAGES.LAST_OWNER;
    case TEAM_ERROR_CODES.MEMBER_NOT_FOUND:
      return TEAM_MESSAGES.MEMBER_GONE;
    case TEAM_ERROR_CODES.INVITE_NOT_FOUND:
      return TEAM_MESSAGES.INVITE_GONE;
    case API_ERROR_CODES.NETWORK:
      return error.message;
    default:
      return fallback;
  }
}

/** The invitation form: `invalid_email` lands on the field, the rest on the form. */
export function mapInviteError(error) {
  if (!(error instanceof ApiError)) return { fieldErrors: {}, formError: TEAM_MESSAGES.GENERIC_ERROR };
  switch (error.code) {
    case TEAM_ERROR_CODES.INVALID_EMAIL:
      return { fieldErrors: { email: TEAM_MESSAGES.EMAIL_INVALID }, formError: null };
    case TEAM_ERROR_CODES.ALREADY_MEMBER:
      return { fieldErrors: { email: TEAM_MESSAGES.ALREADY_MEMBER }, formError: null };
    case TEAM_ERROR_CODES.RATE_LIMITED:
      // The server's sentence says which limit was hit (this game, this person, today or this hour).
      return { fieldErrors: {}, formError: error.message || TEAM_MESSAGES.RATE_LIMITED };
    default:
      return { fieldErrors: {}, formError: describeTeamError(error) };
  }
}

export function isGameNotFound(error) {
  return error instanceof ApiError && error.code === TEAM_ERROR_CODES.GAME_NOT_FOUND;
}
