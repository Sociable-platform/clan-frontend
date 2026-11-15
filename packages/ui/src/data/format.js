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

// Always the 24-hour clock ("21:04", "09:30"), whatever the player's locale would pick.
const TIME_FORMAT = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const DAY_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

/** When a message was sent, as a `Date`, or null when the host sent no time or one that is not a date. */
export function messageTime(message) {
  if (message?.at == null) return null;
  const date = new Date(message.at);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** A message time on the 24-hour clock: "21:04" today, "Nov 14, 21:04" on an earlier day (the date in the player's locale). */
export function formatMessageTime(date, now = new Date()) {
  const time = TIME_FORMAT.format(date);
  return date.toDateString() === now.toDateString() ? time : `${DAY_FORMAT.format(date)}, ${time}`;
}

export const countLabel = (count, max) => `${Math.min(count, max)} / ${max}`;
