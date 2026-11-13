import { useMutation, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/shared/notifications';

import { setAdminGameStatus } from '../api/adminApi';
import { ACCOUNT_STATUS, STATUS_MESSAGES } from '../config/adminConfig';
import { ADMIN_QUERY_KEYS } from '../config/adminQueryKeys';
import { statusErrorMessage } from '../utils/statusErrorMessage';

/**
 * Suspends or resumes one game; the developer's other games keep working. Same rules as
 * `useSetDeveloperStatusMutation`: waits for the server, then refreshes every admin query and toasts.
 */
export function useSetGameStatusMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ gameId, status, reason, note }) => setAdminGameStatus({ gameId, status, reason, note }),
    onSuccess: async (_game, { status }) => {
      showToast({
        message:
          status === ACCOUNT_STATUS.SUSPENDED ? STATUS_MESSAGES.GAME_SUSPENDED : STATUS_MESSAGES.GAME_RESUMED,
      });
      await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.all });
    },
  });

  return {
    setStatus: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.isError ? statusErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
}
