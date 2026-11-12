import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { listAdminDevelopers } from '../api/adminApi';
import { ADMIN_QUERY_KEYS } from '../config/adminQueryKeys';

/**
 * Developers matching `q` and `status`, loaded a page at a time. The pages are joined into one
 * list; `fetchNextPage` loads the next one. While the filters change, the previous list stays on
 * screen (`isRefreshing`) instead of flashing back to a skeleton.
 */
export function useAdminDevelopersQuery({ q, status }) {
  const query = useInfiniteQuery({
    queryKey: ADMIN_QUERY_KEYS.developers({ q: q.trim(), status }),
    queryFn: ({ pageParam, signal }) => listAdminDevelopers({ q, status, cursor: pageParam, signal }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });

  const hasData = query.data !== undefined;

  return {
    developers: query.data?.pages.flatMap((page) => page.developers) ?? [],
    hasNextPage: query.hasNextPage,
    isLoading: query.isPending,
    // A failed first load. A failed "load more" keeps the rows already shown (`isLoadMoreError`).
    isError: query.isError && !hasData,
    isLoadMoreError: query.isFetchNextPageError,
    isFetchingNextPage: query.isFetchingNextPage,
    isRefreshing: query.isFetching && !query.isFetchingNextPage && !query.isPending,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
