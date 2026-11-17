import { formatDate } from '@/shared/utils';

import { TEAM_MESSAGES } from '../../config/teamConfig';

/** The invitations waiting for an answer, newest first, each with Cancel (owners only see this list). */
export function InviteList({ invites, readOnly = false, onCancelClick }) {
  return (
    <ul className="key-list" aria-label="Pending invitations">
      {invites.map((invite) => (
        <li key={invite.id} className="key-row">
          <div className="item-main">
            <p className="member-name">{invite.email}</p>
            <p className="item-meta">
              Invited by {invite.invitedByName || 'a teammate'} · Expires {formatDate(invite.expiresAt)}
            </p>
          </div>
          <button
            type="button"
            className="button button-danger-outline"
            disabled={readOnly}
            aria-label={`${TEAM_MESSAGES.CANCEL_INVITE} for ${invite.email}`}
            onClick={() => onCancelClick(invite)}
          >
            Cancel
          </button>
        </li>
      ))}
    </ul>
  );
}
