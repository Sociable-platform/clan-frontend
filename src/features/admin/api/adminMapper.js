import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { ACCOUNT_STATUS, SYSTEM_ACTOR_PREFIX } from '../config/adminConfig';

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

function mapGame(raw) {
  assertShape(typeof raw?.id === 'string' && typeof raw?.status === 'string');
  return {
    id: raw.id,
    name: raw.name ?? '',
    description: raw.description ?? '',
    status: raw.status,
    isSuspended: raw.status === ACCOUNT_STATUS.SUSPENDED,
    statusReason: raw.statusReason ?? null,
    statusChangedAt: raw.statusChangedAt ?? null,
    createdAt: raw.createdAt,
  };
}

/** Raw `AdminDeveloper` (a developer with their games) -> UI shape. */
export function mapAdminDeveloper(raw) {
  assertShape(
    typeof raw?.id === 'string' &&
      typeof raw?.email === 'string' &&
      typeof raw?.status === 'string' &&
      Array.isArray(raw?.games),
  );
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name ?? '',
    status: raw.status,
    isSuspended: raw.status === ACCOUNT_STATUS.SUSPENDED,
    statusReason: raw.statusReason ?? null,
    statusChangedAt: raw.statusChangedAt ?? null,
    createdAt: raw.createdAt,
    games: raw.games.map(mapGame),
  };
}

/** Raw `AuditEntry` -> UI shape. `actorId` is an admin's ID or `system:...`; `note` is internal text. */
export function mapAuditEntry(raw) {
  assertShape(typeof raw?.id === 'string' && typeof raw?.action === 'string');
  const actorId = typeof raw.actor === 'string' ? raw.actor : '';
  return {
    id: raw.id,
    actorId,
    isSystemActor: actorId.startsWith(SYSTEM_ACTOR_PREFIX),
    action: raw.action,
    targetType: raw.targetType,
    targetId: raw.targetId,
    reason: raw.reason ?? '',
    note: raw.note ?? '',
    createdAt: raw.createdAt,
  };
}

/** Raw `AuditLogPage` -> `{ entries, nextCursor }` (nextCursor is null on the last page). */
export function mapAuditPage(raw) {
  assertShape(Array.isArray(raw?.entries));
  assertShape(raw.nextCursor === null || typeof raw.nextCursor === 'string');
  return { entries: raw.entries.map(mapAuditEntry), nextCursor: raw.nextCursor };
}
