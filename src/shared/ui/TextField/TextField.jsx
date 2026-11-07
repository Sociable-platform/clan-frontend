import { useId } from 'react';

/** Labelled input with an inline error. Extra props (type, autoComplete, ...) go to the input. */
export function TextField({ label, name, error, className = '', ...inputProps }) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
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
