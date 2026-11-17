import { CopyButton } from '@/shared/ui/CopyButton';

import { API_KEYS_MESSAGES } from '../../config/apiKeysConfig';

/**
 * The only place the full key is ever shown. It stays until dismissed; once it is gone
 * (or the page reloads) the key cannot be recovered, only revoked and replaced.
 */
export function NewApiKeyNotice({ apiKey, onDismiss }) {
  return (
    <section className="new-key" aria-labelledby="new-key-heading">
      <div className="new-key-text" role="alert">
        <h3 id="new-key-heading" className="new-key-heading">
          {API_KEYS_MESSAGES.NEW_KEY_HEADING}
        </h3>
        <p className="new-key-warning">{API_KEYS_MESSAGES.NEW_KEY_WARNING}</p>
      </div>
      <div className="new-key-row">
        <code className="new-key-value" aria-label="New API key">
          {apiKey.key}
        </code>
        <CopyButton value={apiKey.key} label="Copy" withIcon />
        <button type="button" className="button button-secondary" onClick={onDismiss}>
          {API_KEYS_MESSAGES.NEW_KEY_DISMISS}
        </button>
      </div>
    </section>
  );
}
