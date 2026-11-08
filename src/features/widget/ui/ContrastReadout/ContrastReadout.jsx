import { MIN_TEXT_CONTRAST } from '../../utils/contrast';

/** A one-line contrast check: the ratio and whether it passes the minimum for normal text. */
export function ContrastReadout({ label, ratio }) {
  if (ratio === null) return null;
  const passes = ratio >= MIN_TEXT_CONTRAST;
  return (
    <div className="readout" data-passes={passes}>
      <span>{label}</span>
      <span className="readout-value">{`${ratio.toFixed(1)}:1 · ${passes ? 'passes' : 'low contrast'}`}</span>
    </div>
  );
}
