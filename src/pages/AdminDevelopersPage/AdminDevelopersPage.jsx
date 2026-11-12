import {
  ADMIN_MESSAGES,
  DevelopersFilters,
  DevelopersTable,
  DevelopersTableSkeleton,
} from '@/features/admin';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';

import { useAdminDevelopersPage } from './useAdminDevelopersPage';

export function AdminDevelopersPage() {
  const page = useAdminDevelopersPage();

  return (
    <div className="page">
      <h1>{ADMIN_MESSAGES.DEVELOPERS_HEADING}</h1>
      <DevelopersFilters
        search={page.search}
        status={page.status}
        onSearchChange={page.handleSearchChange}
        onStatusChange={page.handleStatusChange}
      />
      <section aria-label="Developers">
        {page.isLoading ? (
          <>
            <p role="status" className="visually-hidden">
              {ADMIN_MESSAGES.LOADING}
            </p>
            <DevelopersTableSkeleton />
          </>
        ) : null}
        {page.isError ? (
          <ErrorState
            title={ADMIN_MESSAGES.LIST_ERROR_TITLE}
            message={ADMIN_MESSAGES.LIST_ERROR_MESSAGE}
            onRetry={page.handleRetry}
          />
        ) : null}
        {page.isEmpty && !page.isFiltered ? (
          <EmptyState title={ADMIN_MESSAGES.EMPTY_TITLE} message={ADMIN_MESSAGES.EMPTY_MESSAGE} />
        ) : null}
        {page.isEmpty && page.isFiltered ? (
          <EmptyState title={ADMIN_MESSAGES.NO_MATCH_TITLE} message={ADMIN_MESSAGES.NO_MATCH_MESSAGE} />
        ) : null}
        {page.hasDevelopers ? (
          <>
            <p role="status" className="visually-hidden">
              {page.developers.length} developers shown
            </p>
            <DevelopersTable developers={page.developers} isBusy={page.isRefreshing} />
            {page.isLoadMoreError ? (
              <p role="alert" className="field-error">
                {ADMIN_MESSAGES.LOAD_MORE_ERROR}
              </p>
            ) : null}
            {page.hasNextPage ? (
              <div className="load-more">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={page.isFetchingNextPage}
                  onClick={page.handleLoadMore}
                >
                  {page.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
