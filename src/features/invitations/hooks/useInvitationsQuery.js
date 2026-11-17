import { useQuery } from '@tanstack/react-query';

import { listInvitations } from '../api/invitationsApi';
import { INVITATIONS_QUERY_KEYS } from '../config/invitationsQueryKeys';

/** The signed-in developer's pending invitations. Returns only what the UI needs. */
export function useInvitationsQuery() {
  const query = useQuery({
    queryKey: INVITATIONS_QUERY_KEYS.mine(),
    queryFn: ({ signal }) => listInvitations({ signal }),
  });

  return {
    invitations: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
