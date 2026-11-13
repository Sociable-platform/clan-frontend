import { Link } from 'react-router-dom';

import {
  AuditTimeline,
  AuditTimelineSkeleton,
  DETAIL_MESSAGES,
  DeveloperDetailSkeleton,
  DeveloperGamesTable,
  DeveloperSummary,
} from '@/features/admin';
import { ROUTES } from '@/shared/config';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';

import { useAdminDeveloperDetailPage } from './useAdminDeveloperDetailPage';

export function AdminDeveloperDetailPage() {
  const page = useAdminDeveloperDetailPage();

  if (page.isNotFound) {
    return (
      <div className="page">
        <ErrorState title={DETAIL_MESSAGES.NOT_FOUND_TITLE} message={DETAIL_MESSAGES.NOT_FOUND_MESSAGE} />
        <p>
          <Link to={ROUTES.admin.developers}>{DETAIL_MESSAGES.BACK_TO_LIST_LINK}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <p>
        <Link to={ROUTES.admin.developers}>{DETAIL_MESSAGES.BACK_TO_LIST}</Link>
      </p>

      {page.isLoading ? (
        <>
          <p role="status" className="visually-hidden">
            {DETAIL_MESSAGES.LOADING}
          </p>
          <DeveloperDetailSkeleton />
        </>
      ) : null}
      {page.isError ? (
        <ErrorState
          title={DETAIL_MESSAGES.LOAD_ERROR_TITLE}
          message={DETAIL_MESSAGES.LOAD_ERROR_MESSAGE}
          onRetry={page.handleRetry}
        />
      ) : null}

      {page.developer ? (
        <>
          <DeveloperSummary developer={page.developer} />

          <section aria-labelledby="games-heading">
            <h2 id="games-heading" className="section-title detail-section-title">
              {DETAIL_MESSAGES.GAMES_HEADING}
            </h2>
            {page.hasGames ? (
              <DeveloperGamesTable games={page.games} />
            ) : (
              <EmptyState
                title={DETAIL_MESSAGES.GAMES_EMPTY_TITLE}
                message={DETAIL_MESSAGES.GAMES_EMPTY_MESSAGE}
              />
            )}
          </section>

          <section aria-labelledby="audit-heading">
            <h2 id="audit-heading" className="section-title detail-section-title">
              {DETAIL_MESSAGES.AUDIT_HEADING}
            </h2>
            <p className="item-text detail-section-note">{DETAIL_MESSAGES.AUDIT_NOTE}</p>
            {page.audit.isLoading ? (
              <>
                <p role="status" className="visually-hidden">
                  {DETAIL_MESSAGES.AUDIT_LOADING}
                </p>
                <AuditTimelineSkeleton />
              </>
            ) : null}
            {page.audit.isError ? (
              <ErrorState
                title={DETAIL_MESSAGES.AUDIT_ERROR_TITLE}
                message={DETAIL_MESSAGES.AUDIT_ERROR_MESSAGE}
                onRetry={page.audit.handleRetry}
              />
            ) : null}
            {page.audit.isEmpty ? (
              <EmptyState
                title={DETAIL_MESSAGES.AUDIT_EMPTY_TITLE}
                message={DETAIL_MESSAGES.AUDIT_EMPTY_MESSAGE}
              />
            ) : null}
            {page.audit.hasEntries ? (
              <>
                <AuditTimeline entries={page.audit.entries} />
                {page.audit.isLoadMoreError ? (
                  <p role="alert" className="field-error">
                    {DETAIL_MESSAGES.AUDIT_LOAD_MORE_ERROR}
                  </p>
                ) : null}
                {page.audit.hasNextPage ? (
                  <div className="load-more">
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={page.audit.isFetchingNextPage}
                      onClick={page.audit.handleLoadMore}
                    >
                      {page.audit.isFetchingNextPage ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
