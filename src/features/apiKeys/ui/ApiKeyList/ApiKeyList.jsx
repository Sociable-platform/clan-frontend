import { formatDateTime } from '@/shared/utils';

import { API_KEY_STATUS } from '../../config/apiKeysConfig';

/**
 * A game's keys, newest first. An active key has a Revoke button; a revoked one is struck
 * through and says Revoked where the button was.
 */
export function ApiKeyList({ apiKeys, onRevokeClick }) {
  return (
    <ul className="key-list" aria-label="API keys">
      {apiKeys.map((apiKey) => (
        <li key={apiKey.id} className="key-row">
          <div className="item-main">
            <code className={apiKey.isRevoked ? 'key-prefix key-prefix-revoked' : 'key-prefix'}>
              {apiKey.keyPrefix}…
            </code>
            <p className="item-meta">
              Created {formatDateTime(apiKey.createdAt)} ·{' '}
              {apiKey.isRevoked ? `Revoked ${formatDateTime(apiKey.revokedAt)}` : API_KEY_STATUS.ACTIVE}
            </p>
          </div>
          {apiKey.isRevoked ? (
            <span className="item-meta key-row-state">{API_KEY_STATUS.REVOKED}</span>
          ) : (
            <button
              type="button"
              className="button button-danger-outline"
              onClick={() => onRevokeClick(apiKey)}
              aria-label={`Revoke key ${apiKey.keyPrefix}`}
            >
              Revoke
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
