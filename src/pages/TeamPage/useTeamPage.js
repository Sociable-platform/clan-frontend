import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAccountAccess } from '@/features/auth';
import { useGamesQuery } from '@/features/games';
import {
  describeTeamError,
  TEAM_MESSAGES,
  useCancelInviteMutation,
  useGameInvitesQuery,
  useInviteForm,
  useLeaveGameMutation,
  useRemoveMemberMutation,
  useTeamMembersQuery,
  useTransferOwnershipMutation,
} from '@/features/team';
import { ROUTES } from '@/shared/config';
import { useAuthStore } from '@/store';

/**
 * Owns the data, derived state and handlers of a game's Team page. What a developer sees depends on their
 * role on the game, which comes from the games list: an owner gets the invitation form, the pending
 * invitations and Remove / Make owner on the others; a member sees the team and can leave.
 */
export function useTeamPage(gameId) {
  const navigate = useNavigate();
  const gamesQuery = useGamesQuery();
  const membersQuery = useTeamMembersQuery(gameId);
  const game = gamesQuery.games.find((candidate) => candidate.id === gameId) ?? null;
  const isOwner = game?.isOwner === true;
  // Only owners may read the invitations; a member would get a 403, so nothing is requested for them.
  const invitesQuery = useGameInvitesQuery(gameId, { enabled: isOwner });
  const currentDeveloperId = useAuthStore((state) => state.developer?.id ?? null);
  // A suspended account is read-only: every write would be refused, so the controls are off and say why.
  const { readOnlyMessage } = useAccountAccess();

  const inviteForm = useInviteForm({ gameId });
  const cancelInvite = useCancelInviteMutation(gameId);
  const removeMember = useRemoveMemberMutation(gameId);
  const transfer = useTransferOwnershipMutation(gameId);
  const leave = useLeaveGameMutation(gameId);

  const [memberToRemove, setMemberToRemove] = useState(null);
  const [memberToTransfer, setMemberToTransfer] = useState(null);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);

  const handleCancelInvite = async (invite) => {
    cancelInvite.reset();
    try {
      await cancelInvite.cancelInvite(invite.id);
    } catch {
      // `cancelInvite.isError` shows the message above the list; the list refreshed itself.
    }
  };

  const handleRemoveClick = (member) => {
    removeMember.reset();
    setMemberToRemove(member);
  };
  const handleRemoveCancel = () => {
    if (!removeMember.isPending) setMemberToRemove(null);
  };
  const handleRemoveConfirm = async () => {
    try {
      await removeMember.removeMember(memberToRemove.developerId);
      setMemberToRemove(null);
    } catch {
      // Keep the dialog open; the message says what happened and the person can retry or cancel.
    }
  };

  const handleTransferClick = (member) => {
    transfer.reset();
    setMemberToTransfer(member);
  };
  const handleTransferCancel = () => {
    if (!transfer.isPending) setMemberToTransfer(null);
  };
  const handleTransferConfirm = async () => {
    try {
      await transfer.transferOwnership(memberToTransfer.developerId);
    } catch {
      return;
    }
    setMemberToTransfer(null);
    // The caller's role changed: refresh the games list, which is where the role comes from.
    await gamesQuery.refetch();
  };

  const handleLeaveClick = () => {
    leave.reset();
    setIsLeaveOpen(true);
  };
  const handleLeaveCancel = () => {
    if (!leave.isPending) setIsLeaveOpen(false);
  };
  const handleLeaveConfirm = async () => {
    try {
      await leave.leaveGame();
    } catch {
      return;
    }
    // The game is gone from the developer's list: go there, and let the list catch up.
    navigate(ROUTES.games);
    gamesQuery.refetch();
  };

  const isGameNotFound =
    membersQuery.isGameNotFound || (!gamesQuery.isLoading && !gamesQuery.isError && game === null);

  return {
    game,
    isOwner,
    currentDeveloperId,
    readOnlyMessage,

    isLoading: gamesQuery.isLoading || (membersQuery.isLoading && !membersQuery.isGameNotFound),
    isGameNotFound,
    isGamesError: gamesQuery.isError,
    handleRetryGames: gamesQuery.refetch,

    members: membersQuery.members,
    isMembersError: membersQuery.isError && !membersQuery.isGameNotFound,
    handleRetryMembers: membersQuery.refetch,

    invites: invitesQuery.invites,
    isInvitesLoading: invitesQuery.isLoading,
    isInvitesError: invitesQuery.isError,
    // A 403 owner_required here means the role was lost since the page loaded: say so instead of "try again".
    invitesErrorMessage: describeTeamError(invitesQuery.error, null),
    handleRetryInvites: invitesQuery.refetch,
    cancelInviteError: cancelInvite.isError ? describeTeamError(cancelInvite.error, TEAM_MESSAGES.CANCEL_INVITE_ERROR) : null,

    handleCancelInvite,

    inviteForm,

    memberToRemove,
    isRemoving: removeMember.isPending,
    removeError: removeMember.isError ? describeTeamError(removeMember.error, TEAM_MESSAGES.REMOVE_ERROR) : null,
    handleRemoveClick,
    handleRemoveCancel,
    handleRemoveConfirm,

    memberToTransfer,
    isTransferring: transfer.isPending,
    transferError: transfer.isError ? describeTeamError(transfer.error, TEAM_MESSAGES.TRANSFER_ERROR) : null,
    handleTransferClick,
    handleTransferCancel,
    handleTransferConfirm,

    isLeaveOpen,
    isLeaving: leave.isPending,
    leaveError: leave.isError ? describeTeamError(leave.error, TEAM_MESSAGES.LEAVE_ERROR) : null,
    handleLeaveClick,
    handleLeaveCancel,
    handleLeaveConfirm,
  };
}
