import { Skeleton } from '@/shared/ui/Skeleton';

/** Placeholder shaped like the editor: a section list beside a few field blocks. */
export function WidgetEditorSkeleton() {
  return (
    <div className="editor" aria-hidden="true">
      <div className="editor-nav">
        <Skeleton className="skeleton-nav" />
        <Skeleton className="skeleton-nav" />
        <Skeleton className="skeleton-nav" />
      </div>
      <div className="editor-panel">
        {[0, 1, 2].map((block) => (
          <div key={block} className="form-group">
            <Skeleton className="skeleton-title" />
            <Skeleton className="skeleton-field" />
            <Skeleton className="skeleton-field" />
          </div>
        ))}
      </div>
    </div>
  );
}
