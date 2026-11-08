import { ENDPOINTS, platformClient } from '@/shared/api';

import { mapWidgetDraft } from './widgetMapper';

/** The game's draft, completed with defaults; a game with no saved draft gets the defaults alone. */
export async function getWidgetDraft({ gameId, signal }) {
  const raw = await platformClient.get(ENDPOINTS.games.widgetDraft(gameId), { signal });
  return mapWidgetDraft(raw, { gameId });
}

/** Replaces the draft. The body is `{ config }`; the response (`{ config, updatedAt }`) is not needed. */
export async function saveWidgetDraft({ gameId, config }) {
  await platformClient.put(ENDPOINTS.games.widgetDraft(gameId), { config });
}
