import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { withDefaults } from '../utils/withDefaults';

/**
 * Raw `WidgetDraft` (`{ config, updatedAt }`) -> a complete config to edit. The server's
 * default for a game with no draft is only `{ "schemaVersion": 1 }`, so the missing parts
 * are filled in here. A body without a config object is rejected, so the editor never
 * renders half a document.
 */
export function mapWidgetDraft(raw, { gameId }) {
  const config = raw?.config;
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new ApiError({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: 'The server sent an unexpected response',
    });
  }
  return withDefaults(config, gameId);
}
