import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { WIDGET_ERROR_CODES, WIDGET_MESSAGES } from '../config/widgetConfig';

/**
 * A failed publish -> an explanation and, when the server names fields, the problems with their
 * paths. `message` always says that nothing was published.
 */
export function mapPublishError(error) {
  if (!(error instanceof ApiError)) return { message: WIDGET_MESSAGES.PUBLISH_GENERIC_ERROR, problems: [] };

  if (error.code === WIDGET_ERROR_CODES.INVALID_CONFIG) {
    const problems = error.details
      .filter((detail) => typeof detail?.path === 'string')
      .map((detail) => ({ path: detail.path, message: detail.message || 'This value is not valid' }));
    const reason = error.message ? ` Server: ${error.message}.` : '';
    return { message: `${WIDGET_MESSAGES.PUBLISH_REJECTED}${reason}`, problems };
  }
  if (error.code === API_ERROR_CODES.ACCOUNT_SUSPENDED) return { message: WIDGET_MESSAGES.PUBLISH_SUSPENDED, problems: [] };
  if (error.code === WIDGET_ERROR_CODES.DRAFT_MISSING) return { message: WIDGET_MESSAGES.PUBLISH_NO_DRAFT, problems: [] };
  if (error.code === WIDGET_ERROR_CODES.GAME_NOT_FOUND) return { message: WIDGET_MESSAGES.PUBLISH_GAME_GONE, problems: [] };
  if (error.code === API_ERROR_CODES.NETWORK) return { message: `${error.message}`, problems: [] };
  return { message: WIDGET_MESSAGES.PUBLISH_GENERIC_ERROR, problems: [] };
}

/** A failed rollback -> one message. */
export function mapRollbackError(error) {
  if (error instanceof ApiError && error.code === API_ERROR_CODES.ACCOUNT_SUSPENDED) {
    return WIDGET_MESSAGES.ROLLBACK_SUSPENDED;
  }
  if (error instanceof ApiError && error.code === WIDGET_ERROR_CODES.VERSION_NOT_FOUND) {
    return WIDGET_MESSAGES.ROLLBACK_VERSION_GONE;
  }
  if (error instanceof ApiError && error.code === API_ERROR_CODES.NETWORK) return error.message;
  return WIDGET_MESSAGES.ROLLBACK_ERROR;
}
