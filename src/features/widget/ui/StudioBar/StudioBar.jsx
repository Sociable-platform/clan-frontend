import { Link } from 'react-router-dom';

import { Icon } from '@/shared/ui/Icon';

import { WIDGET_MESSAGES } from '../../config/widgetConfig';
import { PublishStatus } from '../PublishStatus';
import { SaveStatus } from '../SaveStatus';

/**
 * Top bar of the studio: which game, whether the draft is saved, whether players see it, the
 * config and history toggles, and Publish. `publish` is `{ status, latestVersion, nextVersion,
 * isPublishing, onPublish, readOnlyMessage }`; `readOnlyMessage` (a string) turns Publish off and
 * says why. `history` (optional) is `{ canUndo, canRedo, onUndo, onRedo }`: the Undo and Redo
 * buttons, next to the save state because both are about the draft.
 */
export function StudioBar({
  gameName,
  gameHref,
  status,
  onRetry,
  isConfigOpen,
  onToggleConfig,
  isHistoryOpen,
  onToggleHistory,
  publish,
  history = null,
}) {
  return (
    <div className="studio-bar">
      <Link to={gameHref} className="game-chip" aria-label={`Back to ${gameName ?? 'the game'}`}>
        <span className="game-chip-name">{gameName ?? 'Game'}</span>
      </Link>
      {history ? (
        <div className="studio-history" role="group" aria-label="Undo and redo">
          <button
            type="button"
            className="studio-history-button"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            disabled={!history.canUndo}
            onClick={history.onUndo}
          >
            <Icon name="undo" />
          </button>
          <button
            type="button"
            className="studio-history-button"
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
            disabled={!history.canRedo}
            onClick={history.onRedo}
          >
            <Icon name="redo" />
          </button>
        </div>
      ) : null}
      <SaveStatus status={status} onRetry={onRetry} />
      <PublishStatus status={publish.status} latestVersion={publish.latestVersion} />
      <div className="studio-bar-end">
        <button type="button" className="button button-secondary" aria-pressed={isConfigOpen} onClick={onToggleConfig}>
          {isConfigOpen ? 'Hide config' : 'Show config'}
        </button>
        <button type="button" className="button button-secondary" aria-pressed={isHistoryOpen} onClick={onToggleHistory}>
          {isHistoryOpen ? 'Hide history' : 'Show history'}
        </button>
        <button
          type="button"
          className="button"
          disabled={publish.isPublishing || Boolean(publish.readOnlyMessage)}
          title={publish.readOnlyMessage ?? undefined}
          aria-describedby={publish.readOnlyMessage ? 'publish-read-only' : undefined}
          onClick={publish.onPublish}
        >
          {publish.isPublishing ? WIDGET_MESSAGES.PUBLISHING : `${WIDGET_MESSAGES.PUBLISH} v${publish.nextVersion}`}
        </button>
        {publish.readOnlyMessage ? (
          <span id="publish-read-only" className="visually-hidden">
            {publish.readOnlyMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}
