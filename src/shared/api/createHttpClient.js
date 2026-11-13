import { API_ERROR_CODES, ApiError } from './ApiError';

const JSON_CONTENT_TYPE = 'application/json';

async function readJson(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError({
      status: response.status,
      code: API_ERROR_CODES.INVALID_RESPONSE,
      message: 'The server sent a response that is not valid JSON',
    });
  }
}

function toApiError(status, payload) {
  const error = payload?.error;
  return new ApiError({
    status,
    code: error?.code ?? API_ERROR_CODES.UNKNOWN,
    message: error?.message ?? `Request failed with status ${status}`,
    details: Array.isArray(error?.details) ? error.details : [],
  });
}

/**
 * Builds the fetch-based client. The app creates exactly one (see
 * `platformClient.js`); the factory exists so tests can point it at a stub.
 *
 * - `getToken()` supplies the developer token for `Authorization: Bearer`.
 *   A request can pass its own `token` instead (used right after login and
 *   when restoring a stored session, before the store holds a session).
 * - `onUnauthorized(error)` runs once for any 401 on a request that did not
 *   opt out with `skipAuthHandling` (failed logins are ordinary form errors).
 * - `onAccountSuspended(error)` runs once for any 403 `account_suspended`, so a suspension that
 *   happens while the dashboard is open is picked up wherever the refused request came from.
 *   The error is still thrown for the caller.
 */
export function createHttpClient({ baseUrl, getToken, onUnauthorized, onAccountSuspended }) {
  async function request(
    path,
    { method = 'GET', body, signal, token: explicitToken, skipAuthHandling = false } = {},
  ) {
    const headers = { Accept: JSON_CONTENT_TYPE };
    if (body !== undefined) headers['Content-Type'] = JSON_CONTENT_TYPE;

    const token = explicitToken ?? getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
    } catch (cause) {
      if (cause?.name === 'AbortError') throw cause;
      throw new ApiError({
        status: 0,
        code: API_ERROR_CODES.NETWORK,
        message: 'Cannot reach the server. Check your connection and try again.',
      });
    }

    const payload = await readJson(response);
    if (response.ok) return payload;

    const error = toApiError(response.status, payload);
    if (response.status === 401 && !skipAuthHandling) onUnauthorized?.(error);
    if (response.status === 403 && error.code === API_ERROR_CODES.ACCOUNT_SUSPENDED) {
      onAccountSuspended?.(error);
    }
    throw error;
  }

  return {
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  };
}
