// Rooted at `all` so one invalidation refreshes every widget query.
export const WIDGET_QUERY_KEYS = {
  all: ['widget'],
  draft: (gameId) => [...WIDGET_QUERY_KEYS.all, 'draft', gameId],
};
