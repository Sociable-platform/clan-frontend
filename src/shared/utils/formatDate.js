const DATE_FORMAT = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

/** ISO timestamp -> "Nov 7, 2026, 10:00 AM" in the viewer's time zone; empty string when invalid. */
export function formatDateTime(isoString) {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? '' : DATE_FORMAT.format(date);
}
