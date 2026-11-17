import { ENDPOINTS, platformClient } from '@/shared/api';

import { mapInvite, mapInviteList, mapMemberList } from './teamMapper';

export async function listMembers({ gameId, signal }) {
  const raw = await platformClient.get(ENDPOINTS.games.members(gameId), { signal });
  return mapMemberList(raw);
}

/** Owners only: the pending, unexpired invitations of the game. */
export async function listGameInvites({ gameId, signal }) {
  const raw = await platformClient.get(ENDPOINTS.games.invites(gameId), { signal });
  return mapInviteList(raw);
}

/** Owners only. The game and the person inviting come from the address and the login, never from the body. */
export async function inviteToGame({ gameId, email }) {
  const raw = await platformClient.post(ENDPOINTS.games.invites(gameId), { email: email.trim() });
  return mapInvite(raw);
}

export async function cancelInvite({ gameId, inviteId }) {
  await platformClient.delete(ENDPOINTS.games.invite(gameId, inviteId));
}

/** Owners only. The developer loses access at once. */
export async function removeMember({ gameId, developerId }) {
  await platformClient.delete(ENDPOINTS.games.member(gameId, developerId));
}

/** Owners only: the member becomes an owner and the caller a member, in one step. */
export async function transferOwnership({ gameId, developerId }) {
  await platformClient.post(ENDPOINTS.games.transferOwnership(gameId), { developerId });
}

export async function leaveGame({ gameId }) {
  await platformClient.post(ENDPOINTS.games.leave(gameId));
}
