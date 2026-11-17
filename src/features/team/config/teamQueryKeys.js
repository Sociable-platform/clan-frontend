// Rooted at `all` so one invalidation refreshes the teams of every game.
export const TEAM_QUERY_KEYS = {
  all: ['team'],
  members: (gameId) => [...TEAM_QUERY_KEYS.all, gameId, 'members'],
  invites: (gameId) => [...TEAM_QUERY_KEYS.all, gameId, 'invites'],
};
