import { ENDPOINTS, platformClient } from '@/shared/api';

import { mapGame, mapGameList } from './gamesMapper';

export async function listGames({ signal } = {}) {
  const raw = await platformClient.get(ENDPOINTS.games.list, { signal });
  return mapGameList(raw);
}

/** Records an integration for a game the developer already has; never creates a game. */
export async function registerGame({ name, description }) {
  const raw = await platformClient.post(ENDPOINTS.games.create, {
    name: name.trim(),
    description: description.trim(),
  });
  return mapGame(raw);
}
