import { Skeleton } from '@/shared/ui/Skeleton';

const PLACEHOLDER_GAMES = 2;

/** The summary card and a games table, in the same layout as the loaded page. */
export function DeveloperDetailSkeleton() {
  return (
    <div aria-hidden="true" className="detail-skeleton">
      <div className="card detail-summary">
        <div className="detail-summary-head">
          <Skeleton className="skeleton-heading" />
          <Skeleton className="skeleton-pill" />
        </div>
        <Skeleton className="skeleton-text" />
        <Skeleton className="skeleton-meta" />
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <tbody>
            {Array.from({ length: PLACEHOLDER_GAMES }, (_, index) => (
              <tr key={index}>
                <td>
                  <Skeleton className="skeleton-title" />
                  <Skeleton className="skeleton-text" />
                </td>
                <td>
                  <Skeleton className="skeleton-pill" />
                </td>
                <td>
                  <Skeleton className="skeleton-meta" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
