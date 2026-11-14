import { ENDPOINTS, platformClient } from '@/shared/api';

import { buildAuditLogQuery } from '../utils/buildAuditLogQuery';
import { buildDevelopersQuery } from '../utils/buildDevelopersQuery';
import { buildStatusBody } from '../utils/buildStatusBody';

import { mapAdminDeveloper, mapAdminGame, mapAuditPage, mapDeveloperPage } from './adminMapper';

/** One page of developers, newest first. Pass the previous page's `nextCursor` as `cursor`. */
export async function listAdminDevelopers({ q, status, cursor, signal } = {}) {
  const raw = await platformClient.get(
    `${ENDPOINTS.admin.developers}${buildDevelopersQuery({ q, status, cursor })}`,
    { signal },
  );
  return mapDeveloperPage(raw);
}

/** One developer with every game they own. Rejects with `developer_not_found` (404) for an unknown ID. */
export async function getAdminDeveloper({ developerId, signal } = {}) {
  return mapAdminDeveloper(
    await platformClient.get(ENDPOINTS.admin.developer(developerId), { signal }),
  );
}

/** One page of audit entries about `targetId` (a developer or game), newest first. */
export async function listAdminAuditLog({ targetId, cursor, signal } = {}) {
  const raw = await platformClient.get(
    `${ENDPOINTS.admin.auditLog}${buildAuditLogQuery({ targetId, cursor })}`,
    { signal },
  );
  return mapAuditPage(raw);
}

/**
 * Suspends (`status: 'suspended'`, with a `reason` and optional `note`) or resumes (`status: 'active'`)
 * a developer. One call turns off or on every game they own. Returns the developer after the change.
 */
export async function setAdminDeveloperStatus({ developerId, status, reason, note, signal } = {}) {
  return mapAdminDeveloper(
    await platformClient.put(
      ENDPOINTS.admin.developerStatus(developerId),
      buildStatusBody({ status, reason, note }),
      { signal },
    ),
  );
}

/** Same as `setAdminDeveloperStatus` for one game; the developer's other games are not touched. */
export async function setAdminGameStatus({ gameId, status, reason, note, signal } = {}) {
  return mapAdminGame(
    await platformClient.put(
      ENDPOINTS.admin.gameStatus(gameId),
      buildStatusBody({ status, reason, note }),
      { signal },
    ),
  );
}
