import { API_ERROR_CODES, ApiError } from '@/shared/api';

function assertShape(isValid) {
  if (!isValid) {
    throw new ApiError({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: 'The server sent an unexpected response',
    });
  }
}

/** Raw `MyInvite` -> UI shape. The invitation never carries the address: it is the account's own. */
export function mapInvitation(raw) {
  assertShape(typeof raw?.id === 'string' && typeof raw?.gameId === 'string');
  return {
    id: raw.id,
    gameId: raw.gameId,
    gameName: raw.gameName ?? '',
    invitedByName: raw.invitedByName ?? '',
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
  };
}

/** Raw `MyInviteList` -> array, newest first. */
export function mapInvitationList(raw) {
  assertShape(Array.isArray(raw?.invites));
  return raw.invites.map(mapInvitation);
}
