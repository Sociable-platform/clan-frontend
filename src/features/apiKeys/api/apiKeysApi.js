import { ENDPOINTS, platformClient } from '@/shared/api';

import { mapApiKeyList, mapNewApiKey } from './apiKeysMapper';

export async function listApiKeys({ gameId, signal }) {
  const raw = await platformClient.get(ENDPOINTS.games.apiKeys(gameId), { signal });
  return mapApiKeyList(raw);
}

/** The response holds the full key; it is not stored anywhere else and cannot be fetched again. */
export async function createApiKey({ gameId }) {
  const raw = await platformClient.post(ENDPOINTS.games.apiKeys(gameId));
  return mapNewApiKey(raw);
}

export async function revokeApiKey({ keyId }) {
  await platformClient.delete(ENDPOINTS.apiKeys.byId(keyId));
}
