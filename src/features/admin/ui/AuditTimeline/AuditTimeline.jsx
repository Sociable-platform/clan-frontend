import { formatDateTime } from '@/shared/utils';

import { AUDIT_ACTION_LABELS, REASON_LABELS } from '../../config/adminConfig';

const ADMIN_ID_PREVIEW_LENGTH = 8;

// Admin IDs are UUIDs and the API has no admin names, so show the start of the ID (full ID on hover).
function describeActor(entry) {
  if (entry.isSystemActor) return 'System';
  if (!entry.actorId) return 'Unknown';
  return `Admin ${entry.actorId.slice(0, ADMIN_ID_PREVIEW_LENGTH)}`;
}

/** Past status changes, newest first: what happened, who did it, why, the internal note, and when. */
export function AuditTimeline({ entries }) {
  return (
    <ol className="timeline">
      {entries.map((entry) => (
        <li key={entry.id} className="timeline-entry">
          <div className="timeline-head">
            <span className="item-title">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</span>
            <time dateTime={entry.createdAt} className="item-meta">
              {formatDateTime(entry.createdAt)}
            </time>
          </div>
          <p className="item-meta">
            By <span title={entry.actorId}>{describeActor(entry)}</span>
            {entry.reason ? <> · Reason: {REASON_LABELS[entry.reason] ?? entry.reason}</> : null}
          </p>
          {entry.note ? (
            <p className="timeline-note">
              <span className="visually-hidden">Internal note: </span>
              {entry.note}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
