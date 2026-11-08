import { useId } from 'react';

import { FieldError } from '@/shared/ui/FieldError';

/** Slider with a live value read-out. `formatValue` turns the number into the shown text. */
export function RangeField({ label, value, onValueChange, min, max, step = 1, formatValue = String, error = null }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <div className="range-heading">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        <output htmlFor={id} className="range-value">
          {formatValue(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="range-input"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onValueChange(Number(event.target.value))}
      />
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
