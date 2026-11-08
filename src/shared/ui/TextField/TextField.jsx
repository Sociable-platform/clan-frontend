import { useId } from 'react';

/**
 * Labelled input with an inline error. `aside` is short text at the end of the label row
 * (such as "Default"). Extra props (type, autoComplete, ...) go to the input.
 */
export function TextField({ label, name, error, aside = null, className = '', ...inputProps }) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    <div className={`field ${className}`.trim()}>
      <div className="field-label-row">
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
        {aside ? <span className="field-aside">{aside}</span> : null}
      </div>
      <input
        id={inputId}
        name={name}
        className="field-input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} role="alert" className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
