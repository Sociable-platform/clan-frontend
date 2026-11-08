import { API_ERROR_CODES, ApiError } from '@/shared/api';

/**
 * Raw draft response -> the config document. The endpoint returns the document itself
 * (assumed until the draft API is in platform.yaml); a body that is not a config is
 * rejected here so the editor never renders half a document.
 */
export function mapWidgetDraft(raw) {
  const isConfig = raw !== null && typeof raw === 'object' && !Array.isArray(raw) && 'schemaVersion' in raw;
  if (!isConfig) {
    throw new ApiError({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: 'The server sent an unexpected response',
    });
  }
  return raw;
}
