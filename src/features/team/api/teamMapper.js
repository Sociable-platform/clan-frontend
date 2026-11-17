import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { TEAM_ROLES } from '../config/teamConfig';

function assertShape(isValid) {
  if (!isValid) {
    throw new ApiError({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: 'The server sent an unexpected response',
    });
  }
}

/** Raw `GameMember` -> UI shape. */
export function mapMember(raw) {
  assertShape(typeof raw?.developerId === 'string' && typeof raw?.email === 'string');
  const role = raw.role === TEAM_ROLES.OWNER ? TEAM_ROLES.OWNER : TEAM_ROLES.MEMBER;
  return {
    developerId: raw.developerId,
    name: raw.name ?? '',
    email: raw.email,
    role,
    isOwner: role === TEAM_ROLES.OWNER,
    joinedAt: raw.joinedAt,
  };
}

/** Raw `GameMemberList` -> array, owners first as the server sends them. */
export function mapMemberList(raw) {
  assertShape(Array.isArray(raw?.members));
  return raw.members.map(mapMember);
}

/** Raw `GameInvite` (the owner's view of a pending invitation) -> UI shape. */
export function mapInvite(raw) {
  assertShape(typeof raw?.id === 'string' && typeof raw?.email === 'string');
  return {
    id: raw.id,
    email: raw.email,
    invitedByName: raw.invitedByName ?? '',
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
  };
}

/** Raw `GameInviteList` -> array, newest first. */
export function mapInviteList(raw) {
  assertShape(Array.isArray(raw?.invites));
  return raw.invites.map(mapInvite);
}
