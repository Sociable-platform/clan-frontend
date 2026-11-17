// Limits copied from openapi/platform.yaml (RegisterGameRequest).
export const GAMES_LIMITS = {
  NAME_MIN: 1,
  NAME_MAX: 100,
  DESCRIPTION_MAX: 500,
};

// Backend error codes this feature gives a specific meaning.
export const GAMES_ERROR_CODES = {
  INVALID_NAME: 'invalid_name',
  INVALID_DESCRIPTION: 'invalid_description',
};

// The product wording is "Register existing game", never "Create game": the backend
// only records an integration for a game the developer already has.
export const GAMES_MESSAGES = {
  REGISTER_HEADING: 'Register existing game',
  REGISTER_DESCRIPTION: 'Add a game you already run, to give it clans, friends and chat.',
  PAGE_LEAD: 'Connect a game with an API key, then shape its widget.',
  SEARCH_LABEL: 'Search games',
  SEARCH_EMPTY_TITLE: 'No games match your search',
  SEARCH_EMPTY_MESSAGE: 'Check the spelling, or search by the game ID.',
  REGISTER_SUBMIT: 'Register game',
  REGISTER_PENDING: 'Registering…',
  NAME_REQUIRED: 'Enter the game name',
  NAME_TOO_LONG: `Use at most ${GAMES_LIMITS.NAME_MAX} characters`,
  DESCRIPTION_TOO_LONG: `Use at most ${GAMES_LIMITS.DESCRIPTION_MAX} characters`,
  GENERIC_ERROR: 'Something went wrong. Try again.',
  LIST_ERROR_TITLE: 'Could not load your games',
  LIST_EMPTY_TITLE: 'No games yet',
  LIST_EMPTY_MESSAGE: 'Register a game you already have to get its game ID and create API keys for it.',
};
