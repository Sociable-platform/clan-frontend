const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
const DATE_FORMAT = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

function format(isoString, formatter) {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? '' : formatter.format(date);
}

/** ISO timestamp -> "Nov 7, 2026, 10:00 AM" in the viewer's time zone; empty string when invalid. */
export function formatDateTime(isoString) {
  return format(isoString, DATE_TIME_FORMAT);
}

/** ISO timestamp -> "Nov 7, 2026" in the viewer's time zone; empty string when invalid. */
export function formatDate(isoString) {
  return format(isoString, DATE_FORMAT);
}
