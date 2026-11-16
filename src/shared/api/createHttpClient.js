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
 *   when restoring a session, before the store holds it).
 * - `refreshToken()` is asked for a new token when a request is answered 401, which is what an
 *   expired token gets. It resolves to the new token, or to null when the session cannot be
 *   continued; it rejects when it could not find out (the server is unreachable). With a new
 *   token the request is sent again, once, and the caller only sees the second answer. Requests
 *   that fail at the same moment share one refresh. Requests with their own `token` or with
 *   `skipAuthHandling` are never refreshed.
 * - `onUnauthorized(error)` runs once for a 401 that a refresh could not fix, on a request that
 *   did not opt out with `skipAuthHandling` (failed logins are ordinary form errors). It does not
 *   run when the refresh rejected: the session may still be good.
 * - A request passes `withCredentials: true` to send and receive cookies (`credentials: 'include'`).
 *   Only the session requests do (login, token refresh, logout): the refresh token lives in an
 *   HttpOnly cookie of the Platform API. Every other request goes without cookies.
 * - `onAccountSuspended(error)` runs once for any 403 `account_suspended`, so a suspension that
 *   happens while the dashboard is open is picked up wherever the refused request came from.
 *   The error is still thrown for the caller.
 */
export function createHttpClient({
  baseUrl,
  getToken,
  refreshToken,
  onUnauthorized,
  onAccountSuspended,
}) {
  async function send(path, { method, body, signal, withCredentials }, token) {
    const headers = { Accept: JSON_CONTENT_TYPE };
    if (body !== undefined) headers['Content-Type'] = JSON_CONTENT_TYPE;
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
        ...(withCredentials ? { credentials: 'include' } : {}),
      });
    } catch (cause) {
      if (cause?.name === 'AbortError') throw cause;
      throw new ApiError({
        status: 0,
        code: API_ERROR_CODES.NETWORK,
        message: 'Cannot reach the server. Check your connection and try again.',
      });
    }
    return { response, payload: await readJson(response) };
  }

  // The refresh in progress, if any: requests that are refused together wait for the same one.
  let refreshing = null;

  /** Resolves to `{ token }` (null: the session is over) or `{ unavailable: true }`. */
  function refreshOnce() {
    if (!refreshing) {
      refreshing = Promise.resolve()
        .then(() => refreshToken())
        .then(
          (token) => ({ token: token || null }),
          () => ({ unavailable: true }),
        )
        .finally(() => {
          refreshing = null;
        });
    }
    return refreshing;
  }

  async function request(
    path,
    {
      method = 'GET',
      body,
      signal,
      token: explicitToken,
      skipAuthHandling = false,
      withCredentials = false,
    } = {},
  ) {
    const options = { method, body, signal, withCredentials };
    const sentToken = explicitToken ?? getToken?.();
    let { response, payload } = await send(path, options, sentToken);
    let refreshUnavailable = false;

    const mayRefresh = Boolean(refreshToken) && !skipAuthHandling && explicitToken === undefined;
    if (response.status === 401 && mayRefresh) {
      // Another request may have refreshed the token while this one was on its way.
      const current = getToken?.();
      let freshToken = current && current !== sentToken ? current : null;
      if (!freshToken) {
        const outcome = await refreshOnce();
        freshToken = outcome.token ?? null;
        refreshUnavailable = outcome.unavailable === true;
      }
      if (freshToken) ({ response, payload } = await send(path, options, freshToken));
    }

    if (response.ok) return payload;

    const error = toApiError(response.status, payload);
    if (response.status === 401 && !skipAuthHandling && !refreshUnavailable) onUnauthorized?.(error);
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
