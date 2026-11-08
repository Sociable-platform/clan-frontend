import { ENDPOINTS, platformClient } from '@/shared/api';

import { mapWidgetDraft } from './widgetMapper';
import { mapWidgetVersion, mapWidgetVersionList } from './widgetVersionMapper';

/** The game's draft, completed with defaults; a game with no saved draft gets the defaults alone. */
export async function getWidgetDraft({ gameId, signal }) {
  const raw = await platformClient.get(ENDPOINTS.games.widgetDraft(gameId), { signal });
  return mapWidgetDraft(raw, { gameId });
}

/** Replaces the draft. The body is `{ config }`; the response (`{ config, updatedAt }`) is not needed. */
export async function saveWidgetDraft({ gameId, config }) {
  await platformClient.put(ENDPOINTS.games.widgetDraft(gameId), { config });
}

/**
 * Publishes the draft the server holds as the next version. There is no body: the server
 * publishes what it has saved, so the draft must be saved before this is called.
 */
export async function publishWidget({ gameId }) {
  const raw = await platformClient.post(ENDPOINTS.games.widgetPublish(gameId));
  return mapWidgetVersion(raw);
}

/** Published versions, newest first, without their configs. */
export async function listWidgetVersions({ gameId, signal }) {
  const raw = await platformClient.get(ENDPOINTS.games.widgetVersions(gameId), { signal });
  return mapWidgetVersionList(raw);
}

/** One published version with its config. */
export async function getWidgetVersion({ gameId, version, signal }) {
  const raw = await platformClient.get(ENDPOINTS.games.widgetVersion(gameId, version), { signal });
  return mapWidgetVersion(raw);
}

/** Publishes an earlier version again as a new version on top. The draft is left as it is. */
export async function rollbackWidget({ gameId, version }) {
  const raw = await platformClient.post(ENDPOINTS.games.widgetRollback(gameId, version));
  return mapWidgetVersion(raw);
}
