/** One grey placeholder block. Compose these into a skeleton shaped like the real content. */
export function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`skeleton ${className}`.trim()} />;
}
