// Rooted at `all` so one invalidation refreshes the keys of every game.
export const API_KEYS_QUERY_KEYS = {
  all: ['apiKeys'],
  byGame: (gameId) => [...API_KEYS_QUERY_KEYS.all, gameId],
};
