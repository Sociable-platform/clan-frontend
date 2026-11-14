import { useId } from 'react';

/**
 * A titled block of related fields inside a panel. `aside` is short text at the end of the
 * title row (a count, a current value); `description` is a short explanation under it. `tip` is an
 * InfoTip shown right after the title, for the longer explanation that not everyone needs.
 */
export function FormGroup({ title, aside = null, description = null, tip = null, children }) {
  const titleId = useId();
  const heading = (
    <h3 id={titleId} className="form-group-title">
      {title}
    </h3>
  );

  return (
    <section aria-labelledby={titleId} className="form-group">
      <div className="form-group-heading">
        {tip ? (
          <div className="form-group-title-tip">
            {heading}
            {tip}
          </div>
        ) : (
          heading
        )}
        {aside ? <span className="form-group-aside">{aside}</span> : null}
      </div>
      {description ? <p className="form-group-description">{description}</p> : null}
      <div className="form-group-body">{children}</div>
    </section>
  );
}
