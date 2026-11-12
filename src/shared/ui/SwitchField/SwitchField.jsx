import { useId } from 'react';

import { FieldError } from '@/shared/ui/FieldError';

/**
 * On/off setting shown as a card with a switch. A native checkbox with the switch role, so
 * it is keyboard and screen reader ready; the whole card toggles it. `badge` is a short
 * decorative marker (such as a step number) before the text.
 */
export function SwitchField({ label, description = null, badge = null, checked, onCheckedChange, error = null }) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const describedBy = [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="field">
      <div className="switch-card">
        {badge ? (
          <span aria-hidden="true" className="switch-card-badge">
            {badge}
          </span>
        ) : null}
        <div className="switch-card-text">
          <label htmlFor={id} className="switch-card-label">
            {label}
          </label>
          {description ? (
            <p id={descriptionId} className="switch-card-description">
              {description}
            </p>
          ) : null}
        </div>
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
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
