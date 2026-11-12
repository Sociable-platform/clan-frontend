import { Skeleton } from '@/shared/ui/Skeleton';

const PLACEHOLDER_ROWS = 3;

/** Same rows as ApiKeyList: a key prefix, a status line, a button on the right. */
export function ApiKeyListSkeleton() {
  return (
    <ul className="item-list" aria-hidden="true">
      {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
        <li key={index} className="item-row">
          <div className="item-main">
            <Skeleton className="skeleton-title" />
            <Skeleton className="skeleton-text" />
          </div>
          <Skeleton className="skeleton-button" />
        </li>
      ))}
    </ul>
  );
}
