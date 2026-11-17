// Backend error codes this feature gives a specific meaning (openapi/platform.yaml).
export const API_KEYS_ERROR_CODES = {
  GAME_NOT_FOUND: 'game_not_found',
};

export const API_KEYS_MESSAGES = {
  CREATE_LABEL: 'Create API key',
  CREATE_PENDING: 'Creating…',
  CREATE_ERROR: 'Could not create the API key. Try again.',
  PANEL_DESCRIPTION: 'Your game server uses a key to get player tokens. A key is shown once, when you create it.',
  NEW_KEY_HEADING: 'Copy this key now',
  NEW_KEY_WARNING:
    "It is shown only this once. Put it on your game server, never in the game's page. It stays here until you close it.",
  NEW_KEY_DISMISS: 'I saved it',
  REVOKE_TITLE: 'Revoke this API key?',
  REVOKE_CONFIRM: 'Revoke key',
  REVOKE_ERROR: 'Could not revoke the key. Try again.',
  LIST_ERROR_TITLE: 'Could not load API keys',
  LIST_EMPTY_TITLE: 'No API keys yet',
  LIST_EMPTY_MESSAGE: 'Create a key and put it on your game server to connect the game.',
  GAME_NOT_FOUND_TITLE: 'Game not found',
  GAME_NOT_FOUND_MESSAGE: 'This game does not exist or belongs to another developer.',
};

export const API_KEY_STATUS = {
  ACTIVE: 'Active',
  REVOKED: 'Revoked',
};
