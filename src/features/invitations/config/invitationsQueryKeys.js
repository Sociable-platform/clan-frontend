export const INVITATIONS_QUERY_KEYS = {
  all: ['invitations'],
  mine: () => [...INVITATIONS_QUERY_KEYS.all, 'mine'],
};
