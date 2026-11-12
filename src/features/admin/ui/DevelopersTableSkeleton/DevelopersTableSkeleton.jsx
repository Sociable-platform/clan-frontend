import { Skeleton } from '@/shared/ui/Skeleton';

const PLACEHOLDER_ROWS = 5;

/** Same columns as DevelopersTable: a name and email, a pill, a count, a date. */
export function DevelopersTableSkeleton() {
  return (
    <div className="table-scroll" aria-hidden="true">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Developer</th>
            <th scope="col">Status</th>
            <th scope="col" className="data-table-number">
              Games
            </th>
            <th scope="col">Created</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
            <tr key={index}>
              <td>
                <Skeleton className="skeleton-title" />
                <Skeleton className="skeleton-text" />
              </td>
              <td>
                <Skeleton className="skeleton-pill" />
              </td>
              <td className="data-table-number">
                <Skeleton className="skeleton-count" />
              </td>
              <td>
                <Skeleton className="skeleton-meta" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
