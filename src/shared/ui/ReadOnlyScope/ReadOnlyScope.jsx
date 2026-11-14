/**
 * Turns every form control inside it off while `isReadOnly` is set (a `<fieldset disabled>`, so
 * inputs, selects, textareas and buttons all stop at once). While it is not set, the children are
 * rendered as they are, with no extra element, so an active account sees no change.
 */
export function ReadOnlyScope({ isReadOnly, children }) {
  if (!isReadOnly) return children;
  return (
    <fieldset disabled className="read-only-scope">
      {children}
    </fieldset>
  );
}
