import { useId, useState } from 'react';

import { FieldError } from '@/shared/ui/FieldError';

const HEX_COLOR = /^#[0-9A-F]{6}$/;
const FALLBACK_SWATCH = '#000000';

/**
 * Colour as a picker plus a hex box. Values are passed on as `#RRGGBB` in uppercase. Typing
 * a hex that is not complete yet shows a hint and changes nothing; leaving the box restores
 * the last good colour.
 */
export function ColorField({ label, value, onValueChange, error = null }) {
  const id = useId();
  const errorId = `${id}-error`;
  const [draft, setDraft] = useState(null);

  const draftError = draft !== null && !HEX_COLOR.test(draft.trim().toUpperCase()) ? 'Use a color like #80EAFF' : null;
  const shownError = draftError ?? error;

  const handleTextChange = (event) => {
    const raw = event.target.value;
    const normalized = raw.trim().toUpperCase();
    if (HEX_COLOR.test(normalized)) {
      setDraft(null);
      onValueChange(normalized);
    } else {
      setDraft(raw);
    }
  };

  const handlePickerChange = (event) => {
    setDraft(null);
    onValueChange(event.target.value.toUpperCase());
  };

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="color-row">
        <input
          type="color"
          className="color-swatch"
          aria-label={`${label} picker`}
          value={HEX_COLOR.test(value) ? value.toLowerCase() : FALLBACK_SWATCH}
          onChange={handlePickerChange}
        />
        <input
          id={id}
          type="text"
          className="field-input color-hex"
          value={draft ?? value}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={shownError ? 'true' : undefined}
          aria-describedby={shownError ? errorId : undefined}
          onChange={handleTextChange}
          onBlur={() => setDraft(null)}
        />
      </div>
      <FieldError id={errorId}>{shownError}</FieldError>
    </div>
  );
}
