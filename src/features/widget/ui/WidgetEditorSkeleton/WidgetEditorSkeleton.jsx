import { Skeleton } from '@/shared/ui/Skeleton';

/** Placeholder shaped like the studio: a bar, a settings panel, the centre cards and the style panel. */
export function WidgetEditorSkeleton() {
  const panel = (
    <div className="studio-panel">
      <Skeleton className="skeleton-tabs" />
      {[0, 1, 2].map((block) => (
        <div key={block} className="form-group">
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-field" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="studio-body" aria-hidden="true">
      {panel}
      <div className="studio-center">
        <div className="studio-card">
          <Skeleton className="skeleton-stage" />
        </div>
      </div>
      {panel}
    </div>
  );
}
