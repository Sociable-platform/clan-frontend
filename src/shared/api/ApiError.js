export const API_ERROR_CODES = {
  NETWORK: 'network_error',
  INVALID_RESPONSE: 'invalid_response',
  UNKNOWN: 'unknown_error',
};

/**
 * Error thrown for every failed request. Backend errors use the shape
 * `{ "error": { "code": "...", "message": "..." } }`; code and message are
 * copied from it. `status` is 0 when no response arrived.
 */
export class ApiError extends Error {
  constructor({ status, code, message }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
