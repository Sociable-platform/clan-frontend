import { useId } from 'react';

/**
 * Labelled multi-line input with an inline error. `aside` is short text at the end of the label row
 * (such as a character count). Extra props (rows, maxLength, ...) go to the textarea.
 */
export function TextAreaField({ label, name, error, aside = null, className = '', ...textareaProps }) {
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
      <textarea
        id={inputId}
        name={name}
        className="field-input field-textarea"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...textareaProps}
      />
      {error ? (
        <p id={errorId} role="alert" className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
