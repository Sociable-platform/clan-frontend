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
 * optgroup list. `value` and `onValueChange` deal in option values, not events. `tip` (optional)
 * is shown right after the label text: an `InfoTip` that explains the field. It sits beside the
 * label, not inside it, so pressing it does not also open the list.
 */
export function SelectField({ label, value, onValueChange, options = [], groups = null, error = null, tip = null }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <div className="field-label-tip">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {tip}
      </div>
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
