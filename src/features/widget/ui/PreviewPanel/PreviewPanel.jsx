/** Where the live preview of the widget goes. The shared renderer it needs is not built yet. */
export function PreviewPanel() {
  return (
    <section aria-labelledby="preview-heading" className="studio-card">
      <header className="studio-card-header">
        <h2 id="preview-heading" className="studio-card-title">
          Live preview
        </h2>
        <span className="studio-card-note">Mock data · no network · same SDK players load</span>
      </header>
      <div className="preview-stage">
        <p className="preview-empty">The preview shows here once the shared widget renderer is ready.</p>
      </div>
    </section>
  );
}
