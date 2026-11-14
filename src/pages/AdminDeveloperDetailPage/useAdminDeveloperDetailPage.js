import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  ACCOUNT_STATUS,
  useAdminAuditLogQuery,
  useAdminDeveloperQuery,
  useSetDeveloperStatusMutation,
  useSetGameStatusMutation,
} from '@/features/admin';

const CHANGE_KIND = { DEVELOPER: 'developer', GAME: 'game' };
const CHANGE_ACTION = { SUSPEND: 'suspend', RESUME: 'resume' };

/**
 * Owns the data for one developer's page: the developer with their games, the audit history about
 * them, and the suspend or resume change an admin is in the middle of confirming. The queries load
 * separately, so the history can fail or load slowly without hiding the rest.
 */
export function useAdminDeveloperDetailPage() {
  const { developerId } = useParams();
  const developerQuery = useAdminDeveloperQuery(developerId);
  const auditQuery = useAdminAuditLogQuery(developerId);
  const developerStatus = useSetDeveloperStatusMutation();
  const gameStatus = useSetGameStatusMutation();
  // `{ kind, action, game }` while a dialog is open, else null. `game` is set for a game change.
  const [change, setChange] = useState(null);

  const games = developerQuery.developer?.games ?? [];
  const mutation = change?.kind === CHANGE_KIND.GAME ? gameStatus : developerStatus;

  const startChange = (kind, action, game = null) => {
    developerStatus.reset();
    gameStatus.reset();
    setChange({ kind, action, game });
  };

  const handleCancel = () => {
    // The dialog cannot be dismissed while the request is in flight: its outcome is not known yet.
    if (!mutation.isPending) setChange(null);
  };

  // Resuming needs no reason or note, so only a suspension sends them.
  const handleConfirm = async ({ reason, note } = {}) => {
    const isSuspend = change.action === CHANGE_ACTION.SUSPEND;
    const request = isSuspend
      ? { status: ACCOUNT_STATUS.SUSPENDED, reason, note }
      : { status: ACCOUNT_STATUS.ACTIVE };
    try {
      if (change.kind === CHANGE_KIND.GAME) {
        await gameStatus.setStatus({ gameId: change.game.id, ...request });
      } else {
        await developerStatus.setStatus({ developerId, ...request });
      }
      setChange(null);
    } catch {
      // Keep the dialog open; `errorMessage` says why and the status on screen is unchanged.
    }
  };

  return {
    developer: developerQuery.developer,
    games,
    hasGames: games.length > 0,
    isLoading: developerQuery.isLoading,
    isError: developerQuery.isError,
    isNotFound: developerQuery.isNotFound,
    handleRetry: developerQuery.refetch,
    audit: {
      entries: auditQuery.entries,
      hasEntries: auditQuery.entries.length > 0,
      isLoading: auditQuery.isLoading,
      isError: auditQuery.isError,
      isEmpty: !auditQuery.isLoading && !auditQuery.isError && auditQuery.entries.length === 0,
      isLoadMoreError: auditQuery.isLoadMoreError,
      hasNextPage: auditQuery.hasNextPage,
      isFetchingNextPage: auditQuery.isFetchingNextPage,
      handleRetry: auditQuery.refetch,
      handleLoadMore: auditQuery.fetchNextPage,
    },
    statusChange: {
      isSuspendOpen: change?.action === CHANGE_ACTION.SUSPEND,
      isResumeOpen: change?.action === CHANGE_ACTION.RESUME,
      kind: change?.kind ?? CHANGE_KIND.DEVELOPER,
      subjectName:
        change?.kind === CHANGE_KIND.GAME ? change.game.name : (developerQuery.developer?.email ?? ''),
      isPending: mutation.isPending,
      errorMessage: mutation.errorMessage,
      handleCancel,
      handleConfirm,
    },
    handleSuspendDeveloper: () => startChange(CHANGE_KIND.DEVELOPER, CHANGE_ACTION.SUSPEND),
    handleResumeDeveloper: () => startChange(CHANGE_KIND.DEVELOPER, CHANGE_ACTION.RESUME),
    handleSuspendGame: (game) => startChange(CHANGE_KIND.GAME, CHANGE_ACTION.SUSPEND, game),
    handleResumeGame: (game) => startChange(CHANGE_KIND.GAME, CHANGE_ACTION.RESUME, game),
  };
}
