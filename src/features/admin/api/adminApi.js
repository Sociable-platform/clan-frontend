import { ENDPOINTS, platformClient } from '@/shared/api';

import { buildAuditLogQuery } from '../utils/buildAuditLogQuery';
import { buildDevelopersQuery } from '../utils/buildDevelopersQuery';

import { mapAdminDeveloper, mapAuditPage, mapDeveloperPage } from './adminMapper';

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
