import { formatDateTime } from '@/shared/utils';

import { WIDGET_MESSAGES } from '../../config/widgetConfig';
import { describeConfig } from '../../utils/measureConfig';
import { ConfigPanel } from '../ConfigPanel';

/**
 * A published version shown in place of the draft's config: read-only JSON, when it was
 * published, and the way back (to the draft) or forward (roll back to it). `isLive` hides
 * Roll back, since rolling back to the live version would change nothing. `readOnlyMessage` turns
 * Roll back off (the account is suspended) and shows as its tooltip.
 */
export function VersionPreviewPanel({
  versionNumber,
  version,
  isLoading,
  isError,
  isLive,
  onRetry,
  onClose,
  onRollBack,
  readOnlyMessage = null,
}) {
  if (isLoading || isError || !version) {
    return (
      <section aria-label={`Version ${versionNumber}`} className="studio-card">
        <div className="version-body">
          {isError ? (
            <div role="alert" className="version-message">
              <p>{`${WIDGET_MESSAGES.PREVIEW_ERROR_TITLE} (version ${versionNumber}).`}</p>
              <div className="version-actions">
                <button type="button" className="button button-secondary" onClick={onRetry}>
                  Try again
                </button>
                <button type="button" className="button button-secondary" onClick={onClose}>
                  {WIDGET_MESSAGES.PREVIEW_BACK}
                </button>
              </div>
            </div>
          ) : (
            <p role="status" className="studio-card-note">
              {`Loading version ${versionNumber}`}
            </p>
          )}
        </div>
      </section>
    );
  }

  const { json, bytes } = describeConfig(version.config);
  return (
    <ConfigPanel
      json={json}
      bytes={bytes}
      schemaVersion={version.config.schemaVersion}
      heading={`Version ${version.version}`}
      note={`Published ${formatDateTime(version.publishedAt)} · read-only`}
      actions={
        <>
          <button type="button" className="button button-secondary" onClick={onClose}>
            {WIDGET_MESSAGES.PREVIEW_BACK}
          </button>
          {isLive ? null : (
            <button
              type="button"
              className="button"
              disabled={Boolean(readOnlyMessage)}
              title={readOnlyMessage ?? undefined}
              onClick={() => onRollBack(version)}
            >
              {`Roll back to v${version.version}`}
            </button>
          )}
        </>
      }
    />
  );
}
