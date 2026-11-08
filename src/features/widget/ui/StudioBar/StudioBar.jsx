import { Link } from 'react-router-dom';

import { SaveStatus } from '../SaveStatus';

/** Top bar of the studio: which game, whether the draft is saved, and the config toggle. */
export function StudioBar({ gameName, gameId, gameHref, status, onRetry, isConfigOpen, onToggleConfig }) {
  return (
    <div className="studio-bar">
      <Link to={gameHref} className="game-chip" aria-label={`Back to ${gameName ?? 'the game'}`}>
        <span className="game-chip-name">{gameName ?? 'Game'}</span>
        <span className="game-chip-id">{gameId}</span>
      </Link>
      <SaveStatus status={status} onRetry={onRetry} />
      <button
        type="button"
        className="button button-secondary studio-bar-end"
        aria-pressed={isConfigOpen}
        onClick={onToggleConfig}
      >
        {isConfigOpen ? 'Hide config' : 'Show config'}
      </button>
    </div>
  );
}
