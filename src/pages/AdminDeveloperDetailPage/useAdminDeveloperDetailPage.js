import { useParams } from 'react-router-dom';

import { useAdminAuditLogQuery, useAdminDeveloperQuery } from '@/features/admin';

/**
 * Owns the data for one developer's page: the developer with their games, and the audit history
 * about them. The two load separately, so the history can fail or load slowly without hiding the rest.
 */
export function useAdminDeveloperDetailPage() {
  const { developerId } = useParams();
  const developerQuery = useAdminDeveloperQuery(developerId);
  const auditQuery = useAdminAuditLogQuery(developerId);

  const games = developerQuery.developer?.games ?? [];

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
  };
}
