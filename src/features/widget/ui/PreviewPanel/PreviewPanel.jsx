import { SelectField } from '@/shared/ui/SelectField';

import { PREVIEW_VIEWS } from '../../config/widgetPreview';
import { useWidgetPreview } from '../../hooks/useWidgetPreview';

/** The live preview: the real widget drawn from the draft with fake data, on a plain background. */
export function PreviewPanel({ config, assetUrls }) {
  const preview = useWidgetPreview(config, assetUrls);

  return (
    <section aria-labelledby="preview-heading" className="studio-card">
      <header className="studio-card-header">
        <h2 id="preview-heading" className="studio-card-title">
          Live preview
        </h2>
        <span className="studio-card-note">Mock data · no network · same code players load</span>
      </header>
      <div className="preview-screens" role="group" aria-label="Widget view to preview">
        {PREVIEW_VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            className="chip"
            aria-pressed={preview.selectedView === view.id}
            onClick={() => preview.handleSelectView(view.id)}
          >
            {view.label}
            {view.hint ? <span className="preview-screen-hint"> · {view.hint}</span> : null}
          </button>
        ))}
      </div>
      <div className="preview-viewer">
        <SelectField
          label="Viewing as"
          value={preview.viewerRole}
          options={preview.roleOptions}
          onValueChange={preview.handleSelectViewerRole}
        />
        <p className="preview-viewer-note">Pick a role, then open Members and click someone to see what that role can do.</p>
      </div>
      <div className="preview-stage">
        <div ref={preview.containerRef} className="preview-canvas" role="region" aria-label="Widget preview" />
      </div>
    </section>
  );
}
