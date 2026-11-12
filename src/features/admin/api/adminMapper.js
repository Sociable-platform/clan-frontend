import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { ACCOUNT_STATUS } from '../config/adminConfig';

function assertShape(isValid) {
  if (!isValid) {
    throw new ApiError({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: 'The server sent an unexpected response',
    });
  }
}

/** Raw `AdminDeveloperSummary` -> UI shape. An unknown status is kept as sent, not rejected. */
export function mapDeveloperSummary(raw) {
  assertShape(
    typeof raw?.id === 'string' && typeof raw?.email === 'string' && typeof raw?.status === 'string',
  );
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name ?? '',
    status: raw.status,
    isSuspended: raw.status === ACCOUNT_STATUS.SUSPENDED,
    gameCount: typeof raw.gameCount === 'number' ? raw.gameCount : 0,
    createdAt: raw.createdAt,
  };
}

/** Raw `AdminDeveloperList` -> `{ developers, nextCursor }` (nextCursor is null on the last page). */
export function mapDeveloperPage(raw) {
  assertShape(Array.isArray(raw?.developers));
  assertShape(raw.nextCursor === null || typeof raw.nextCursor === 'string');
  return { developers: raw.developers.map(mapDeveloperSummary), nextCursor: raw.nextCursor };
}
