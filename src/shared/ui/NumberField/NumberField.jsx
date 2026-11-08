import { useId, useState } from 'react';

import { FieldError } from '@/shared/ui/FieldError';

/**
 * Number input. Whatever number is typed is passed on, even outside `min`/`max`, so the
 * server's range check decides and its message shows here. While the box is empty or
 * half-typed nothing is passed on, and the last good value comes back on blur.
 */
export function NumberField({ label, value, onValueChange, min, max, step = 1, hint = null, error = null }) {
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

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        className="field-input"
        value={draft ?? String(value)}
        min={min}
        max={max}
        step={step}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        onChange={handleChange}
        onBlur={() => setDraft(null)}
      />
      {hint ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
