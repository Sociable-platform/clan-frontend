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
const DAY_YEAR_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/** When a message was sent, as a `Date`, or null when the host sent no time or one that is not a date. */
export function messageTime(message) {
  if (message?.at == null) return null;
  const date = new Date(message.at);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** A message time on the 24-hour clock ("21:04"). The day is on the day line above the day's first message. */
export function formatMessageTime(date) {
  return TIME_FORMAT.format(date);
}

/** Whether two dates fall on the same day on the player's calendar. */
export function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

/**
 * The day line's label: "Today", "Yesterday", "Nov 14" earlier this year, "Nov 14, 2025" in an earlier year
 * (the date in the player's locale).
 */
export function formatMessageDay(date, now = new Date()) {
  if (isSameDay(date, now)) return 'Today';
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return (date.getFullYear() === now.getFullYear() ? DAY_FORMAT : DAY_YEAR_FORMAT).format(date);
}

/**
 * The line under a friend's name: the name of the clan they are in (`friend.clan.name`), or an empty
 * string when they are in none or the host does not know. Online or offline is the dot on their picture.
 */
export function friendClanName(friend) {
  const name = friend?.clan?.name;
  return typeof name === 'string' ? name.trim() : '';
}

export const countLabel = (count, max) => `${Math.min(count, max)} / ${max}`;
