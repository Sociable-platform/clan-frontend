import { formatDateTime } from '@/shared/utils';

import { WIDGET_MESSAGES } from '../../config/widgetConfig';

/**
 * Published versions, newest first. The newest is the one players get ("Live"). Each can be
 * previewed; every one but the live one can be rolled back to.
 */
export function VersionHistoryPanel({
  versions,
  latestVersion,
  previewedVersion,
  isLoading,
  isError,
  onRetry,
  onPreview,
  onRollBack,
}) {
  return (
    <section aria-labelledby="history-heading" className="studio-card">
      <header className="studio-card-header">
        <h2 id="history-heading" className="studio-card-title">
          {WIDGET_MESSAGES.HISTORY_TITLE}
        </h2>
        {versions.length > 0 ? (
          <span className="chip-static">{`${versions.length} ${versions.length === 1 ? 'version' : 'versions'}`}</span>
        ) : null}
        <span className="studio-card-note">Players only ever see published versions</span>
      </header>

      <div className="version-body">
        {isLoading ? (
          <p role="status" className="studio-card-note">
            Loading the version history
          </p>
        ) : null}

        {isError ? (
          <div role="alert" className="version-message">
            <p>{WIDGET_MESSAGES.HISTORY_ERROR_TITLE}</p>
            <button type="button" className="button button-secondary" onClick={onRetry}>
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && versions.length === 0 ? (
          <div className="version-message">
            <p className="version-message-title">{WIDGET_MESSAGES.HISTORY_EMPTY_TITLE}</p>
            <p className="studio-card-note">{WIDGET_MESSAGES.HISTORY_EMPTY_MESSAGE}</p>
          </div>
        ) : null}

        {versions.length > 0 ? (
          <ol aria-label="Published versions" className="version-list">
            {versions.map((version) => {
              const isLive = version.version === latestVersion;
              return (
                <li key={version.version} className="version-row">
                  <span className="version-number">{`v${version.version}`}</span>
                  <span className="version-date">{formatDateTime(version.publishedAt)}</span>
                  {isLive ? <span className="chip-static">{WIDGET_MESSAGES.HISTORY_LIVE}</span> : null}
                  {version.version === previewedVersion ? (
                    <span className="chip-static chip-static-muted">{WIDGET_MESSAGES.HISTORY_PREVIEWING}</span>
                  ) : null}
                  <span className="version-actions">
                    <button
                      type="button"
                      className="button button-secondary"
                      aria-label={`Preview version ${version.version}`}
                      onClick={() => onPreview(version.version)}
                    >
                      {WIDGET_MESSAGES.HISTORY_PREVIEW}
                    </button>
                    {isLive ? null : (
                      <button
                        type="button"
                        className="button button-secondary"
                        aria-label={`Roll back to version ${version.version}`}
                        onClick={() => onRollBack(version)}
                      >
                        {WIDGET_MESSAGES.HISTORY_ROLL_BACK}
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
