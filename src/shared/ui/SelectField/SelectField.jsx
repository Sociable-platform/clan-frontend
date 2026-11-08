import { useId } from 'react';

import { FieldError } from '@/shared/ui/FieldError';

function renderOption(option) {
  return (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  );
}

/**
 * Labelled dropdown. Pass `options` ({ value, label }) or `groups` ({ label, options }) for an
 * optgroup list. `value` and `onValueChange` deal in option values, not events.
 */
export function SelectField({ label, value, onValueChange, options = [], groups = null, error = null }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select
        id={id}
        className="field-input field-select"
        value={value}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {groups
          ? groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(renderOption)}
              </optgroup>
            ))
          : options.map(renderOption)}
      </select>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
