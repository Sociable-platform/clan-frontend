import { useId, useState } from 'react';

import { FieldError } from '@/shared/ui/FieldError';

const clamp = (value, min, max) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));

/**
 * A number setting as a stepper card: label and hint on the left, − value + on the right.
 * The buttons move by `step` and stay within `min`/`max`; the box itself takes any value (its
 * native step is "any", so a value off the button grid is not flagged by the browser). Typing passes on any number, even outside them, so the
 * server's range check decides and its message shows here. While the box is empty or
 * half-typed nothing is passed on, and the last good value comes back on blur.
 */
export function NumberField({ label, value, onValueChange, min, max, step = 1, unit = null, hint = null, error = null }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [draft, setDraft] = useState(null);
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  const handleChange = (event) => {
    const raw = event.target.value;
    setDraft(raw);
    if (raw.trim() !== '' && Number.isFinite(Number(raw))) onValueChange(Number(raw));
  };

  const handleStep = (direction) => {
    setDraft(null);
    onValueChange(clamp(value + direction * step, min, max));
  };

  return (
    <div className="field">
      <div className="stepper-card">
        <div className="stepper-text">
          <label htmlFor={id} className="stepper-label">
            {label}
          </label>
          {hint ? (
            <p id={hintId} className="stepper-hint">
              {hint}
            </p>
          ) : null}
        </div>
        <div className="stepper-controls">
          <button type="button" className="stepper-button" aria-label={`Decrease ${label}`} onClick={() => handleStep(-1)}>
            −
          </button>
          <input
            id={id}
            type="number"
            inputMode="numeric"
            className="stepper-input"
            value={draft ?? String(value)}
            min={min}
            max={max}
            step="any"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy || undefined}
            onChange={handleChange}
            onBlur={() => setDraft(null)}
          />
          {unit ? (
            <span aria-hidden="true" className="stepper-unit">
              {unit}
            </span>
          ) : null}
          <button type="button" className="stepper-button" aria-label={`Increase ${label}`} onClick={() => handleStep(1)}>
            +
          </button>
        </div>
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
