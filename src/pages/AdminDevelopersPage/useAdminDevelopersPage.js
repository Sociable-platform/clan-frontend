import { useState } from 'react';

import { ALL_STATUSES, SEARCH_DEBOUNCE_MS, useAdminDevelopersQuery } from '@/features/admin';
import { useDebouncedValue } from '@/shared/hooks';

/** Owns the filters and the paged list for the developers page; the page itself only renders. */
export function useAdminDevelopersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(ALL_STATUSES);
  // The box updates on every key, but the server is asked only once typing pauses.
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const list = useAdminDevelopersQuery({ q: debouncedSearch, status });

  const hasFilters = debouncedSearch.trim() !== '' || status !== ALL_STATUSES;
  const hasDevelopers = list.developers.length > 0;
  const isEmpty = !list.isLoading && !list.isError && !hasDevelopers;

  return {
    search,
    status,
    developers: list.developers,
    isLoading: list.isLoading,
    isError: list.isError,
    isRefreshing: list.isRefreshing,
    isEmpty,
    isFiltered: hasFilters,
    hasDevelopers,
    hasNextPage: list.hasNextPage,
    isFetchingNextPage: list.isFetchingNextPage,
    isLoadMoreError: list.isLoadMoreError,
    handleSearchChange: setSearch,
    handleStatusChange: setStatus,
    handleLoadMore: list.fetchNextPage,
    handleRetry: list.refetch,
  };
}
