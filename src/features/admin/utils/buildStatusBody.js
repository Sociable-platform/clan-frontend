import { ACCOUNT_STATUS } from '../config/adminConfig';

/**
 * Request body for `PUT .../status`. Suspending sends the reason and, when there is one, the note.
 * Resuming sends the status alone: the audit entry records the reason of the suspension that ended.
 * A blank note is left out instead of sent empty.
 */
export function buildStatusBody({ status, reason = '', note = '' }) {
  if (status !== ACCOUNT_STATUS.SUSPENDED) return { status };
  const body = { status, reason };
  const trimmedNote = note.trim();
  if (trimmedNote) body.note = trimmedNote;
  return body;
}
