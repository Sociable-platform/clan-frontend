import { useId } from 'react';

/** A titled block of related fields. `description` is a one-line explanation under the title. */
export function FormGroup({ title, description = null, children }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="form-group">
      <h3 id={titleId} className="form-group-title">
        {title}
      </h3>
      {description ? <p className="field-hint">{description}</p> : null}
      <div className="form-group-body">{children}</div>
    </section>
  );
}
