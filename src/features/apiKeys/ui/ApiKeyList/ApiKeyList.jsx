import { formatDateTime } from '@/shared/utils';

import { API_KEY_STATUS } from '../../config/apiKeysConfig';

export function ApiKeyList({ apiKeys, onRevokeClick }) {
  return (
    <ul className="item-list" aria-label="API keys">
      {apiKeys.map((apiKey) => (
        <li key={apiKey.id} className="item-row">
          <div className="item-main">
            <code className="key-prefix">{apiKey.keyPrefix}…</code>
            <p className="item-text">
              <span className={apiKey.isRevoked ? 'badge badge-muted' : 'badge'}>
                {apiKey.isRevoked ? API_KEY_STATUS.REVOKED : API_KEY_STATUS.ACTIVE}
              </span>{' '}
              Created {formatDateTime(apiKey.createdAt)}
              {apiKey.isRevoked ? `, revoked ${formatDateTime(apiKey.revokedAt)}` : ''}
            </p>
          </div>
          {apiKey.isRevoked ? null : (
            <button
              type="button"
              className="button button-secondary"
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
