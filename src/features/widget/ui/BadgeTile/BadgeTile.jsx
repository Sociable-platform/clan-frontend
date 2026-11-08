/**
 * One badge icon the developer can allow or hide. A switch, with its state written out. `isSelected` marks
 * the one badge the developer is looking at (only one at a time carries the highlight). A custom badge
 * shows its imported image, or its first letter when the file is not in this browser.
 */
export function BadgeTile({ badge, isOn, isSelected = false, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={badge.label}
      data-selected={isSelected}
      className="badge-tile"
      onClick={() => onToggle(!isOn)}
    >
      <span aria-hidden="true" className="badge-tile-glyph">
        {badge.imageUrl ? <img src={badge.imageUrl} alt="" className="badge-tile-image" /> : badge.glyph}
      </span>
      <span aria-hidden="true" className="badge-tile-state">
        {isOn ? 'On' : 'Off'}
      </span>
    </button>
  );
}
