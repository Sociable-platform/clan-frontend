import { API_ERROR_CODES, ApiError } from '@/shared/api';
import { ACCOUNT_STATUS } from '@/store';

function assertShape(isValid) {
  if (!isValid) {
    throw new ApiError({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: 'The server sent an unexpected response',
    });
  }
}

/** Raw `LoginResponse` -> `{ token, expiresAt }` (expiresAt in ms since epoch). */
export function mapLoginResponse(raw, now = Date.now()) {
  assertShape(typeof raw?.token === 'string' && typeof raw?.expiresIn === 'number');
  return { token: raw.token, expiresAt: now + raw.expiresIn * 1000 };
}

/** Raw `Admin` (from `/admin/me`) -> UI shape. */
export function mapAdmin(raw) {
  assertShape(typeof raw?.id === 'string' && typeof raw?.email === 'string');
  return { id: raw.id, email: raw.email, name: raw.name ?? '' };
}

/**
 * Raw `Developer` -> UI shape. `statusReason` is the reason code (`non_payment`, `abuse`, `other`)
 * while suspended, else null; the admin's internal note is never part of this response. A missing
 * status counts as active, so an older backend still works.
 */
export function mapDeveloper(raw) {
  assertShape(typeof raw?.id === 'string' && typeof raw?.email === 'string');
  const status = typeof raw.status === 'string' ? raw.status : ACCOUNT_STATUS.ACTIVE;
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name ?? '',
    createdAt: raw.createdAt,
    status,
    isSuspended: status === ACCOUNT_STATUS.SUSPENDED,
    statusReason: raw.statusReason ?? null,
  };
}
