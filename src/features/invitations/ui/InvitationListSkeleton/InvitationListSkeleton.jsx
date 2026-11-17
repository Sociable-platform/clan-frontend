import { Skeleton } from '@/shared/ui/Skeleton';

const PLACEHOLDER_ROWS = 2;

/** Same rows as InvitationList: a game name, an inviter line, two buttons. */
export function InvitationListSkeleton() {
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
