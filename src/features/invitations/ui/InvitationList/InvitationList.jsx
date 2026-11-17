import { formatDate } from '@/shared/utils';

import { INVITATIONS_MESSAGES } from '../../config/invitationsConfig';

/**
 * The invitations waiting for the signed-in developer, newest first. `pendingId` is the one being answered
 * (its buttons and the others' are off); `readOnly` turns Accept and Decline off for a suspended account.
 */
export function InvitationList({ invitations, pendingId = null, readOnly = false, onAccept, onDecline }) {
  return (
    <ul className="key-list" aria-label="Invitations">
      {invitations.map((invitation) => {
        const isBusy = pendingId !== null;
        return (
          <li key={invitation.id} className="key-row invitation-row">
            <div className="item-main">
              <p className="member-name">{invitation.gameName}</p>
              <p className="item-meta">
                Invited by {invitation.invitedByName || 'a teammate'} · Expires {formatDate(invitation.expiresAt)}
              </p>
            </div>
            <div className="game-row-actions">
              <button
                type="button"
                className="button"
                disabled={isBusy || readOnly}
                aria-label={`${INVITATIONS_MESSAGES.ACCEPT} the invitation to ${invitation.gameName}`}
                onClick={() => onAccept(invitation)}
              >
                {pendingId === invitation.id ? 'Working…' : INVITATIONS_MESSAGES.ACCEPT}
              </button>
              <button
                type="button"
                className="button button-secondary"
                disabled={isBusy || readOnly}
                aria-label={`${INVITATIONS_MESSAGES.DECLINE} the invitation to ${invitation.gameName}`}
                onClick={() => onDecline(invitation)}
              >
                {INVITATIONS_MESSAGES.DECLINE}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
