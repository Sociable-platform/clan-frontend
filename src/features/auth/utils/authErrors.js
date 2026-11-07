import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { AUTH_ERROR_CODES, AUTH_MESSAGES } from '../config/authMessages';

const REGISTER_FIELD_BY_CODE = {
  [AUTH_ERROR_CODES.INVALID_NAME]: 'name',
  [AUTH_ERROR_CODES.INVALID_EMAIL]: 'email',
  [AUTH_ERROR_CODES.EMAIL_TAKEN]: 'email',
  [AUTH_ERROR_CODES.INVALID_PASSWORD]: 'password',
};

function toMessage(error, knownCodes) {
  if (!(error instanceof ApiError)) return AUTH_MESSAGES.GENERIC_ERROR;
  // Backend messages for these codes are written for people; anything else
  // (5xx, unknown 4xx) gets the generic text instead of a status line.
  if (knownCodes.includes(error.code) || error.code === API_ERROR_CODES.NETWORK) {
    return error.message;
  }
  return AUTH_MESSAGES.GENERIC_ERROR;
}

/** Login failures are never field-specific (the server does not say which half was wrong). */
export function mapLoginError(error) {
  return { fieldErrors: {}, formError: toMessage(error, [AUTH_ERROR_CODES.INVALID_CREDENTIALS]) };
}

/** Validation codes map to the field named by the backend; everything else is a form error. */
export function mapRegisterError(error) {
  const field = error instanceof ApiError ? REGISTER_FIELD_BY_CODE[error.code] : undefined;
  if (field) return { fieldErrors: { [field]: error.message }, formError: null };
  return { fieldErrors: {}, formError: toMessage(error, []) };
}
