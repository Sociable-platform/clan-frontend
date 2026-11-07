/** Page-level error for a failed load. `onRetry` renders a Try again button. */
export function ErrorState({ title, message, onRetry = null }) {
  return (
    <div role="alert" className="state-panel state-panel-error">
      <h2 className="state-title">{title}</h2>
      <p className="state-message">{message}</p>
      {onRetry ? (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
