import { ENDPOINTS, platformClient } from '@/shared/api';

import { mapWidgetDraft } from './widgetMapper';

/** The game's draft; the server answers with a default config when none was saved yet. */
export async function getWidgetDraft({ gameId, signal }) {
  const raw = await platformClient.get(ENDPOINTS.games.widgetDraft(gameId), { signal });
  return mapWidgetDraft(raw);
}

/** Replaces the draft. A rejected config fails with `invalid_widget_config` and per-field `details`. */
export async function saveWidgetDraft({ gameId, config }) {
  await platformClient.put(ENDPOINTS.games.widgetDraft(gameId), config);
}
