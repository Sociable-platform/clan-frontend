/**
 * Tiny drawing for a choice card (decorative; the card's label names the choice). Shapes
 * come from CSS and the `data-value`, so the picture always matches what the option does.
 * kinds: dock (panel position), mode, corners, frame, button.
 */
export function ChoicePreview({ kind, value }) {
  return (
    <span className={`choice-art choice-art-${kind}`} data-value={value}>
      {kind === 'dock' || kind === 'mode' ? <i /> : null}
      {kind === 'mode' ? <i /> : null}
      {kind === 'button' ? 'Join' : null}
    </span>
  );
}
