import { useInfiniteQuery } from '@tanstack/react-query';

import { listAdminAuditLog } from '../api/adminApi';
import { ADMIN_QUERY_KEYS } from '../config/adminQueryKeys';

/**
 * Audit entries about one developer or game, newest first, a page at a time. The pages are joined
 * into one list; `fetchNextPage` loads the next one.
 */
export function useAdminAuditLogQuery(targetId) {
  const query = useInfiniteQuery({
    queryKey: ADMIN_QUERY_KEYS.auditLog(targetId),
    queryFn: ({ pageParam, signal }) => listAdminAuditLog({ targetId, cursor: pageParam, signal }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const hasData = query.data !== undefined;

  return {
    entries: query.data?.pages.flatMap((page) => page.entries) ?? [],
    hasNextPage: query.hasNextPage,
    isLoading: query.isPending,
    // A failed first load. A failed "load more" keeps the entries already shown (`isLoadMoreError`).
    isError: query.isError && !hasData,
    isLoadMoreError: query.isFetchNextPageError,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
