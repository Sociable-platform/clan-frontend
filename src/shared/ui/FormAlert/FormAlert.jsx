/** Form-level message. Errors interrupt screen readers (alert); notices wait their turn (status). */
export function FormAlert({ tone = 'error', children, className = '' }) {
  const role = tone === 'error' ? 'alert' : 'status';
  return (
    <p role={role} className={`form-alert form-alert-${tone} ${className}`.trim()}>
      {children}
    </p>
  );
}
