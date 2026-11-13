import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

import { getAdminDeveloper } from '../api/adminApi';
import { ADMIN_ERROR_CODES } from '../config/adminConfig';
import { ADMIN_QUERY_KEYS } from '../config/adminQueryKeys';

/** One developer with their games. `isNotFound` is the 404 for an unknown (or malformed) ID. */
export function useAdminDeveloperQuery(developerId) {
  const query = useQuery({
    queryKey: ADMIN_QUERY_KEYS.developer(developerId),
    queryFn: ({ signal }) => getAdminDeveloper({ developerId, signal }),
  });

  const isNotFound =
    query.error instanceof ApiError && query.error.code === ADMIN_ERROR_CODES.DEVELOPER_NOT_FOUND;

  return {
    developer: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError && !isNotFound,
    isNotFound,
    refetch: query.refetch,
  };
}
