/** Inline error under a field. `id` is the target of the field's aria-describedby. */
export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="field-error">
      {children}
    </p>
  );
}
