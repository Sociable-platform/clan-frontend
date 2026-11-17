import { ENDPOINTS, platformClient } from '@/shared/api';

import { mapInvitationList } from './invitationsMapper';

/** The invitations sent to the email address of the signed-in developer's account. */
export async function listInvitations({ signal } = {}) {
  const raw = await platformClient.get(ENDPOINTS.invites.list, { signal });
  return mapInvitationList(raw);
}

/** Joins the game as a member. Only the account the invitation was sent to may accept it. */
export async function acceptInvitation({ inviteId }) {
  await platformClient.post(ENDPOINTS.invites.accept(inviteId));
}

export async function declineInvitation({ inviteId }) {
  await platformClient.post(ENDPOINTS.invites.decline(inviteId));
}
