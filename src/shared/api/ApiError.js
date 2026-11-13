export const API_ERROR_CODES = {
  NETWORK: 'network_error',
  INVALID_RESPONSE: 'invalid_response',
  UNKNOWN: 'unknown_error',
  // 403 from any write while the developer's account is suspended (read-only dashboard).
  ACCOUNT_SUSPENDED: 'account_suspended',
};

/**
 * Error thrown for every failed request. Backend errors use the shape
 * `{ "error": { "code": "...", "message": "...", "details": [...] } }`; code, message
 * and details are copied from it. `details` is an empty array when the server sent
 * none (only validation errors carry them). `status` is 0 when no response arrived.
 */
export class ApiError extends Error {
  constructor({ status, code, message, details = [] }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
