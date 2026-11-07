// Rooted at `all` so one invalidation refreshes every games query.
export const GAMES_QUERY_KEYS = {
  all: ['games'],
  list: () => [...GAMES_QUERY_KEYS.all, 'list'],
};
