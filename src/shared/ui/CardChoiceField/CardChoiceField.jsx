import { useId } from 'react';

import { FieldError } from '@/shared/ui/FieldError';

/**
 * Pick one option from cards built on real radio buttons. An option can carry a small
 * `preview` (decorative, hidden from screen readers) and a `description`. `columns` sets the
 * grid width on wide screens; narrow screens wrap by themselves. `hideLabels` is for swatch
 * rows where the picture is the choice; the label stays for screen readers.
 */
export function CardChoiceField({ legend, value, options, onValueChange, columns = 2, hideLabels = false, error = null }) {
  const name = useId();
  const errorId = `${name}-error`;

  return (
    <fieldset className="field choice-field" aria-describedby={error ? errorId : undefined}>
      <legend className="visually-hidden">{legend}</legend>
      <div className={`choice-grid ${hideLabels ? 'choice-grid-swatches' : ''}`.trim()} style={{ '--choice-columns': columns }}>
        {options.map((option) => {
          const descriptionId = `${name}-${option.value}-description`;
          return (
            <label key={option.value} className="choice-card">
              <input
                type="radio"
                name={name}
                value={option.value}
                className="choice-input"
                checked={value === option.value}
                aria-describedby={option.description ? descriptionId : undefined}
                onChange={() => onValueChange(option.value)}
              />
              {option.preview ? (
                <span aria-hidden="true" className="choice-preview">
                  {option.preview}
                </span>
              ) : null}
              <span className={hideLabels ? 'visually-hidden' : 'choice-label'}>{option.label}</span>
              {option.description ? (
                <span id={descriptionId} aria-hidden="true" className="choice-description">
                  {option.description}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}
