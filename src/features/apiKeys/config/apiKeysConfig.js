// Backend error codes this feature gives a specific meaning (openapi/platform.yaml).
export const API_KEYS_ERROR_CODES = {
  GAME_NOT_FOUND: 'game_not_found',
};

export const API_KEYS_MESSAGES = {
  CREATE_LABEL: 'Create API key',
  CREATE_PENDING: 'Creating…',
  CREATE_ERROR: 'Could not create the API key. Try again.',
  NEW_KEY_HEADING: 'Your new API key',
  NEW_KEY_WARNING:
    'Copy this key now. It is shown only once and cannot be retrieved later. Keep it on your game server, never in browser code.',
  NEW_KEY_DISMISS: 'I have saved the key',
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
