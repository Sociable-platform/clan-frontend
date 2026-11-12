/** Shown when a list loaded fine but has nothing in it. */
export function EmptyState({ title, message }) {
  return (
    <div role="status" className="state-panel">
      <h2 className="state-title">{title}</h2>
      <p className="state-message">{message}</p>
    </div>
  );
}
