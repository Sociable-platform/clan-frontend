import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { GAME_ROLES } from '../config/gamesConfig';

function assertShape(isValid) {
  if (!isValid) {
    throw new ApiError({
      status: 200,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: 'The server sent an unexpected response',
    });
  }
}

// A server from before games had teams sends no role: every game was the developer's own then.
function mapRole(role) {
  if (role === undefined || role === GAME_ROLES.OWNER) return GAME_ROLES.OWNER;
  return GAME_ROLES.MEMBER;
}

/** Raw `Game` -> UI shape. `isOwner` says whether the signed-in developer may use the owner-only controls. */
export function mapGame(raw) {
  assertShape(typeof raw?.id === 'string' && typeof raw?.name === 'string');
  const role = mapRole(raw.role);
  return {
    id: raw.id,
    name: raw.name,
    role,
    isOwner: role === GAME_ROLES.OWNER,
    description: raw.description ?? '',
    createdAt: raw.createdAt,
  };
}

/** Raw `GameList` envelope -> plain array of games (newest first, as the server sends them). */
export function mapGameList(raw) {
  assertShape(Array.isArray(raw?.games));
  return raw.games.map(mapGame);
}
