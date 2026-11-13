import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { ADMIN_ERROR_CODES, STATUS_MESSAGES } from '../config/adminConfig';

const NOT_FOUND_CODES = [ADMIN_ERROR_CODES.DEVELOPER_NOT_FOUND, ADMIN_ERROR_CODES.GAME_NOT_FOUND];
const REJECTED_CODES = [
  ADMIN_ERROR_CODES.REASON_REQUIRED,
  ADMIN_ERROR_CODES.INVALID_REASON,
  ADMIN_ERROR_CODES.INVALID_NOTE,
  ADMIN_ERROR_CODES.INVALID_STATUS,
];

/** What to tell the admin when a suspend or resume request failed. The status was not changed. */
export function statusErrorMessage(error) {
  if (!(error instanceof ApiError)) return STATUS_MESSAGES.ERROR_GENERIC;
  if (NOT_FOUND_CODES.includes(error.code)) return STATUS_MESSAGES.ERROR_NOT_FOUND;
  if (REJECTED_CODES.includes(error.code)) return STATUS_MESSAGES.ERROR_REJECTED;
  if (error.code === API_ERROR_CODES.NETWORK) return STATUS_MESSAGES.ERROR_NETWORK;
  return STATUS_MESSAGES.ERROR_GENERIC;
}
