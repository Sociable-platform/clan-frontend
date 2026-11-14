import { formatDateTime } from '@/shared/utils';

import { REASON_LABELS } from '../../config/adminConfig';
import { StatusPill } from '../StatusPill';
import { StatusSwitch } from '../StatusSwitch';

/**
 * The developer's name, email, status, the reason they were suspended, and when they joined, with the
 * button that suspends or resumes the whole account.
 */
export function DeveloperSummary({ developer, onSuspend, onResume }) {
  const reason = developer.statusReason ? (REASON_LABELS[developer.statusReason] ?? developer.statusReason) : null;

  return (
    <section aria-labelledby="developer-heading" className="card detail-summary">
      <div className="detail-summary-head">
        <h1 id="developer-heading">{developer.name || developer.email}</h1>
        <StatusPill status={developer.status} />
        <div className="detail-summary-actions">
          <StatusSwitch
            isSuspended={developer.isSuspended}
            subjectName={developer.email}
            onSuspend={onSuspend}
            onResume={onResume}
          />
        </div>
      </div>
      <dl className="detail-list">
        <div>
          <dt>Email</dt>
          <dd>{developer.email}</dd>
        </div>
        {developer.name ? (
          <div>
            <dt>Name</dt>
            <dd>{developer.name}</dd>
          </div>
        ) : null}
        {developer.isSuspended && reason ? (
          <div>
            <dt>Reason</dt>
            <dd>{reason}</dd>
          </div>
        ) : null}
        {developer.isSuspended && developer.statusChangedAt ? (
          <div>
            <dt>Suspended on</dt>
            <dd>{formatDateTime(developer.statusChangedAt)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Registered</dt>
          <dd>{formatDateTime(developer.createdAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
