import { Skeleton } from '@/shared/ui/Skeleton';

const PLACEHOLDER_ROWS = 3;

/** Same rows as GameList: a title line, a shorter description line, a date on the right. */
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
