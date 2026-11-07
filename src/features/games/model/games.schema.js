import { GAMES_LIMITS, GAMES_MESSAGES } from '../config/gamesConfig';

/** Returns `{ field: message }` for each invalid field; an empty object means valid. */
export function validateGameValues({ name, description }) {
  const errors = {};

  const trimmedName = name.trim();
  if (trimmedName.length < GAMES_LIMITS.NAME_MIN) errors.name = GAMES_MESSAGES.NAME_REQUIRED;
  else if (trimmedName.length > GAMES_LIMITS.NAME_MAX) errors.name = GAMES_MESSAGES.NAME_TOO_LONG;

  if (description.trim().length > GAMES_LIMITS.DESCRIPTION_MAX) {
    errors.description = GAMES_MESSAGES.DESCRIPTION_TOO_LONG;
  }

  return errors;
}
