import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useAccountAccess } from '@/features/auth';
import { GAMES_QUERY_KEYS } from '@/features/games';
import {
  describeInvitationError,
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useInvitationsQuery,
} from '@/features/invitations';

/**
 * Owns the data and handlers of the invitations page. Accepting makes a new game appear in the developer's
 * list, so the games list is refreshed here: a feature does not reach into another feature's cache.
 */
export function useInvitationsPage() {
  const queryClient = useQueryClient();
  const { invitations, isLoading, isError, refetch } = useInvitationsQuery();
  const accept = useAcceptInvitationMutation();
  const decline = useDeclineInvitationMutation();
  // A suspended account is read-only: answering an invitation is a write and would be refused.
  const { readOnlyMessage } = useAccountAccess();

  const [pendingId, setPendingId] = useState(null);
  const [answerError, setAnswerError] = useState(null);
  const [joinedGame, setJoinedGame] = useState(null);

  const handleAccept = async (invitation) => {
    setPendingId(invitation.id);
    setAnswerError(null);
    setJoinedGame(null);
    try {
      await accept.acceptInvitation(invitation.id);
    } catch (error) {
      setAnswerError(describeInvitationError(error));
      return;
    } finally {
      setPendingId(null);
    }
    setJoinedGame({ id: invitation.gameId, name: invitation.gameName });
    await queryClient.invalidateQueries({ queryKey: GAMES_QUERY_KEYS.all });
  };

  const handleDecline = async (invitation) => {
    setPendingId(invitation.id);
    setAnswerError(null);
    setJoinedGame(null);
    try {
      await decline.declineInvitation(invitation.id);
    } catch (error) {
      setAnswerError(describeInvitationError(error));
    } finally {
      setPendingId(null);
    }
  };

  return {
    invitations,
    isLoading,
    isError,
    isEmpty: !isLoading && !isError && invitations.length === 0,
    hasInvitations: invitations.length > 0,
    pendingId,
    answerError,
    joinedGame,
    readOnlyMessage,
    handleRetry: refetch,
    handleAccept,
    handleDecline,
  };
}
