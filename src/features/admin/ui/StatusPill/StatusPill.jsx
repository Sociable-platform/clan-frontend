import { ACCOUNT_STATUS, STATUS_LABELS } from '../../config/adminConfig';

/** Active or Suspended as a word, not only a colour. TEAM-204 reuses it for games. */
export function StatusPill({ status }) {
  const isSuspended = status === ACCOUNT_STATUS.SUSPENDED;
  const className = isSuspended ? 'badge badge-danger' : 'badge badge-muted';
  return <span className={className}>{STATUS_LABELS[status] ?? status}</span>;
}
