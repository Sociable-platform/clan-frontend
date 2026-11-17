import { Skeleton } from '@/shared/ui/Skeleton';

const PLACEHOLDER_ROWS = 3;

/** Stands in for the games table: a name and a description line per row, the buttons on the right. */
export function GameListSkeleton() {
  return (
    <ul className="item-list" aria-hidden="true">
      {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
        <li key={index} className="item-row">
          <div className="item-main">
            <Skeleton className="skeleton-title" />
            <Skeleton className="skeleton-text" />
          </div>
          <Skeleton className="skeleton-meta" />
        </li>
      ))}
    </ul>
  );
}
