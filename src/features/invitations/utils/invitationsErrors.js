import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { INVITATIONS_ERROR_CODES, INVITATIONS_MESSAGES } from '../config/invitationsConfig';

/** What to tell the person when answering an invitation failed. */
export function describeInvitationError(error) {
  if (!(error instanceof ApiError)) return INVITATIONS_MESSAGES.GENERIC_ERROR;
  switch (error.code) {
    case INVITATIONS_ERROR_CODES.INVITE_NOT_FOUND:
      return INVITATIONS_MESSAGES.INVITE_GONE;
    case INVITATIONS_ERROR_CODES.INVITE_EXPIRED:
      return INVITATIONS_MESSAGES.INVITE_EXPIRED;
    case API_ERROR_CODES.NETWORK:
      return error.message;
    default:
      return INVITATIONS_MESSAGES.GENERIC_ERROR;
  }
}
