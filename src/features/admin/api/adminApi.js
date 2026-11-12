import { ENDPOINTS, platformClient } from '@/shared/api';

import { buildDevelopersQuery } from '../utils/buildDevelopersQuery';

import { mapDeveloperPage } from './adminMapper';

/** One page of developers, newest first. Pass the previous page's `nextCursor` as `cursor`. */
export async function listAdminDevelopers({ q, status, cursor, signal } = {}) {
  const raw = await platformClient.get(
    `${ENDPOINTS.admin.developers}${buildDevelopersQuery({ q, status, cursor })}`,
    { signal },
  );
  return mapDeveloperPage(raw);
}
