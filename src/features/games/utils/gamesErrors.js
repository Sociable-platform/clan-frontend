import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { GAMES_ERROR_CODES, GAMES_MESSAGES } from '../config/gamesConfig';

const FIELD_BY_CODE = {
  [GAMES_ERROR_CODES.INVALID_NAME]: 'name',
  [GAMES_ERROR_CODES.INVALID_DESCRIPTION]: 'description',
};

/** Validation codes land on their field; network errors keep their text; the rest is generic. */
export function mapRegisterGameError(error) {
  if (!(error instanceof ApiError)) return { fieldErrors: {}, formError: GAMES_MESSAGES.GENERIC_ERROR };

  const field = FIELD_BY_CODE[error.code];
  if (field) return { fieldErrors: { [field]: error.message }, formError: null };

  const formError = error.code === API_ERROR_CODES.NETWORK ? error.message : GAMES_MESSAGES.GENERIC_ERROR;
  return { fieldErrors: {}, formError };
}
