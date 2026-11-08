import { useId } from 'react';

import { FieldError } from '@/shared/ui/FieldError';

/** Pick one of a few options, shown as a segmented control built from real radio buttons. */
export function SegmentedField({ legend, value, onValueChange, options, error = null }) {
  const name = useId();
  const errorId = `${name}-error`;

  return (
    <fieldset className="field segmented-field" aria-describedby={error ? errorId : undefined}>
      <legend className="field-label">{legend}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label key={option.value} className="segmented-option">
            <input
              type="radio"
              name={name}
              value={option.value}
              className="segmented-input"
              checked={value === option.value}
              onChange={() => onValueChange(option.value)}
            />
            <span className="segmented-text">{option.label}</span>
          </label>
        ))}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}
