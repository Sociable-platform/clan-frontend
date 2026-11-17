import { formatDate } from '@/shared/utils';

import { TEAM_ROLE_LABELS } from '../../config/teamConfig';

/**
 * Everybody on a game, owners first, each with their role. For an owner (`canManage`) every other
 * developer has Remove, and every member also has "Make owner" (hand the game over); nobody can act on
 * themselves here (leaving is its own button). `readOnly` turns the buttons off for a suspended account.
 */
export function MemberList({
  members,
  currentDeveloperId,
  canManage,
  readOnly = false,
  onRemoveClick,
  onTransferClick,
}) {
  return (
    <ul className="key-list" aria-label="Team members">
      {members.map((member) => {
        const isYou = member.developerId === currentDeveloperId;
        const label = member.name || member.email;
        return (
          <li key={member.developerId} className="key-row">
            <div className="item-main">
              <p className="member-name">
                {label}
                {isYou ? <span className="item-meta"> (you)</span> : null}{' '}
                <span
                  className={member.isOwner ? 'badge' : 'badge badge-muted'}
                  aria-label={`${label} is ${TEAM_ROLE_LABELS[member.role]}`}
                >
                  {TEAM_ROLE_LABELS[member.role]}
                </span>
              </p>
              <p className="item-meta">
                {member.name ? `${member.email} · ` : ''}Joined {formatDate(member.joinedAt)}
              </p>
            </div>
            {canManage && !isYou ? (
              <div className="game-row-actions">
                {!member.isOwner ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={readOnly}
                    aria-label={`Make ${label} the owner`}
                    onClick={() => onTransferClick(member)}
                  >
                    Make owner
                  </button>
                ) : null}
                <button
                  type="button"
                  className="button button-danger-outline"
                  disabled={readOnly}
                  aria-label={`Remove ${label}`}
                  onClick={() => onRemoveClick(member)}
                >
                  Remove
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
