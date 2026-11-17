import { TEAM_LIMITS, TEAM_MESSAGES } from '../config/teamConfig';

// Plain "name@host.tld": the server is the judge (invalid_email); this catches typos before a request.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns `{ field: message }` for each invalid field; an empty object means valid. */
export function validateInviteValues({ email }) {
  const trimmed = email.trim();
  if (trimmed === '') return { email: TEAM_MESSAGES.EMAIL_REQUIRED };
  if (trimmed.length > TEAM_LIMITS.EMAIL_MAX) return { email: TEAM_MESSAGES.EMAIL_TOO_LONG };
  if (!EMAIL_PATTERN.test(trimmed)) return { email: TEAM_MESSAGES.EMAIL_INVALID };
  return {};
}
