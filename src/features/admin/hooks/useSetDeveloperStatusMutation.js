import { useMutation, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/shared/notifications';

import { setAdminDeveloperStatus } from '../api/adminApi';
import { ACCOUNT_STATUS, STATUS_MESSAGES } from '../config/adminConfig';
import { ADMIN_QUERY_KEYS } from '../config/adminQueryKeys';
import { statusErrorMessage } from '../utils/statusErrorMessage';

/**
 * Suspends or resumes a developer, and with them every game they own. It waits for the server (no
 * optimistic update: the screen must never show a suspension that did not happen), then refreshes
 * every admin query (the developer, their games, the list and the history) and shows a toast.
 * `setStatus` rejects on failure; the status on screen is then unchanged and `errorMessage` says why.
 */
export function useSetDeveloperStatusMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ developerId, status, reason, note }) =>
      setAdminDeveloperStatus({ developerId, status, reason, note }),
    // Returned so the call resolves only once the screen shows the new status.
    onSuccess: async (_developer, { status }) => {
      showToast({
        message:
          status === ACCOUNT_STATUS.SUSPENDED
            ? STATUS_MESSAGES.DEVELOPER_SUSPENDED
            : STATUS_MESSAGES.DEVELOPER_RESUMED,
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
