import { useId } from 'react';

import { FieldError } from '@/shared/ui/FieldError';

/** On/off setting. A native checkbox with the switch role, so it is keyboard and screen reader ready. */
export function SwitchField({ label, description = null, checked, onCheckedChange, error = null }) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const describedBy = [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="field switch-field">
      <label htmlFor={id} className="switch-label">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="switch-input"
          checked={checked}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <span className="switch-track" aria-hidden="true" />
        <span className="switch-text">{label}</span>
      </label>
      {description ? (
        <p id={descriptionId} className="field-hint">
          {description}
        </p>
      ) : null}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
