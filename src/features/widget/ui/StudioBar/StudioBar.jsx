import { Link } from 'react-router-dom';

import { WIDGET_MESSAGES } from '../../config/widgetConfig';
import { PublishStatus } from '../PublishStatus';
import { SaveStatus } from '../SaveStatus';

/**
 * Top bar of the studio: which game, whether the draft is saved, whether players see it, the
 * config and history toggles, and Publish. `publish` is `{ status, latestVersion, nextVersion,
 * isPublishing, onPublish }`.
 */
export function StudioBar({
  gameName,
  gameId,
  gameHref,
  status,
  onRetry,
  isConfigOpen,
  onToggleConfig,
  isHistoryOpen,
  onToggleHistory,
  publish,
}) {
  return (
    <div className="studio-bar">
      <Link to={gameHref} className="game-chip" aria-label={`Back to ${gameName ?? 'the game'}`}>
        <span className="game-chip-name">{gameName ?? 'Game'}</span>
        <span className="game-chip-id">{gameId}</span>
      </Link>
      <SaveStatus status={status} onRetry={onRetry} />
      <PublishStatus status={publish.status} latestVersion={publish.latestVersion} />
      <div className="studio-bar-end">
        <button type="button" className="button button-secondary" aria-pressed={isConfigOpen} onClick={onToggleConfig}>
          {isConfigOpen ? 'Hide config' : 'Show config'}
        </button>
        <button type="button" className="button button-secondary" aria-pressed={isHistoryOpen} onClick={onToggleHistory}>
          {isHistoryOpen ? 'Hide history' : 'Show history'}
        </button>
        <button type="button" className="button" disabled={publish.isPublishing} onClick={publish.onPublish}>
          {publish.isPublishing ? WIDGET_MESSAGES.PUBLISHING : `${WIDGET_MESSAGES.PUBLISH} v${publish.nextVersion}`}
        </button>
      </div>
    </div>
  );
}
