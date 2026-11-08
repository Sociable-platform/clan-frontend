const DATE_FORMAT = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** "Nov 2, 2026" from an ISO date, or an empty string when it is missing or not a date. */
export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : DATE_FORMAT.format(date);
}

/** Up to two capital letters from a name, for the avatar circle. */
export function initialsOf(name) {
  return String(name ?? '')
    .trim()
    .slice(0, 2)
    .toUpperCase();
}

export const countLabel = (count, max) => `${Math.min(count, max)} / ${max}`;
