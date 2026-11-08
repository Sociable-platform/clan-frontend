import { useId } from 'react';

/**
 * A titled block of related fields inside a panel. `aside` is short text at the end of the
 * title row (a count, a current value); `description` is a short explanation under it.
 */
export function FormGroup({ title, aside = null, description = null, children }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="form-group">
      <div className="form-group-heading">
        <h3 id={titleId} className="form-group-title">
          {title}
        </h3>
        {aside ? <span className="form-group-aside">{aside}</span> : null}
      </div>
      {description ? <p className="form-group-description">{description}</p> : null}
      <div className="form-group-body">{children}</div>
    </section>
  );
}
