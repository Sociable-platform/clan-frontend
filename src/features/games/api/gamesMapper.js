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

/** Raw `Game` -> UI shape. */
export function mapGame(raw) {
  assertShape(typeof raw?.id === 'string' && typeof raw?.name === 'string');
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    createdAt: raw.createdAt,
  };
}

/** Raw `GameList` envelope -> plain array of games (newest first, as the server sends them). */
export function mapGameList(raw) {
  assertShape(Array.isArray(raw?.games));
  return raw.games.map(mapGame);
}
