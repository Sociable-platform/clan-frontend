/** One badge icon the developer can allow or hide. A switch, with its state written out. */
export function BadgeTile({ badge, isOn, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={badge.label}
      className="badge-tile"
      onClick={() => onToggle(!isOn)}
    >
      <span aria-hidden="true" className="badge-tile-glyph">
        {badge.glyph}
      </span>
      <span aria-hidden="true" className="badge-tile-state">
        {isOn ? 'On' : 'Off'}
      </span>
    </button>
  );
}
