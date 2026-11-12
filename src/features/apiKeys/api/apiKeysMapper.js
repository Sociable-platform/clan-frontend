import { API_ERROR_CODES, ApiError } from '@/shared/api';

function assertShape(isValid) {
  if (!isValid) {
    throw new ApiError({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: 'The server sent an unexpected response',
    });
  }
}

/** Raw `ApiKey` -> UI shape. The full key never appears here, only its prefix. */
export function mapApiKey(raw) {
  assertShape(typeof raw?.id === 'string' && typeof raw?.keyPrefix === 'string');
  return {
    id: raw.id,
    gameId: raw.gameId,
    keyPrefix: raw.keyPrefix,
    createdAt: raw.createdAt,
    revokedAt: raw.revokedAt ?? null,
    isRevoked: raw.revokedAt != null,
  };
}

/** Raw `ApiKeyList` envelope -> plain array (newest first, as the server sends them). */
export function mapApiKeyList(raw) {
  assertShape(Array.isArray(raw?.apiKeys));
  return raw.apiKeys.map(mapApiKey);
}

/** Raw `NewApiKey` -> the key row plus the one-time secret `key`. */
export function mapNewApiKey(raw) {
  assertShape(typeof raw?.key === 'string' && raw.key !== '');
  return { ...mapApiKey(raw), key: raw.key };
}
