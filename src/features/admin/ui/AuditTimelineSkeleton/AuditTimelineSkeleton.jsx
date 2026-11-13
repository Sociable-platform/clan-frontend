import { Skeleton } from '@/shared/ui/Skeleton';

const PLACEHOLDER_ENTRIES = 3;

/** Same rows as AuditTimeline: an action with a date, a line about who and why. */
export function AuditTimelineSkeleton() {
  return (
    <ol className="timeline" aria-hidden="true">
      {Array.from({ length: PLACEHOLDER_ENTRIES }, (_, index) => (
        <li key={index} className="timeline-entry">
          <div className="timeline-head">
            <Skeleton className="skeleton-title" />
            <Skeleton className="skeleton-meta" />
          </div>
          <Skeleton className="skeleton-text" />
        </li>
      ))}
    </ol>
  );
}
