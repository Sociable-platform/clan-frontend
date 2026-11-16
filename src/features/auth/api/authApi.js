import { ENDPOINTS, platformClient } from '@/shared/api';

import { mapAdmin, mapDeveloper, mapLoginResponse } from './authMapper';

// A wrong password or a taken email is a form error, not an expired session,
// so these calls opt out of the 401 handler.
const FORM_REQUEST = { skipAuthHandling: true };

// The developer session requests (login, token refresh, logout) send and receive the refresh
// cookie. They also opt out of the 401 handler: a refused refresh is handled by whoever asked.
const SESSION_REQUEST = { skipAuthHandling: true, withCredentials: true };

export async function registerDeveloper({ name, email, password }) {
  const raw = await platformClient.post(
    ENDPOINTS.developers.register,
    { name: name.trim(), email: email.trim(), password },
    FORM_REQUEST,
  );
  return mapDeveloper(raw);
}

/** Logs in. The answer also sets the refresh cookie, which is why the request carries credentials. */
export async function loginDeveloper({ email, password }) {
  const raw = await platformClient.post(
    ENDPOINTS.developers.login,
    { email: email.trim(), password },
    SESSION_REQUEST,
  );
  return mapLoginResponse(raw);
}

/**
 * Exchanges the refresh cookie for a new developer token: `{ token, expiresAt }`. The server
 * replaces the cookie as well. Rejects with a 401 `invalid_refresh_token` when there is no
 * session to continue (never logged in, logged out, expired).
 */
export async function refreshDeveloperSession({ signal } = {}) {
  const raw = await platformClient.post(ENDPOINTS.developers.tokenRefresh, undefined, {
    ...SESSION_REQUEST,
    signal,
  });
  return mapLoginResponse(raw);
}

/** Ends the session on the server and clears the refresh cookie. Works with or without a session. */
export async function logoutDeveloper() {
  await platformClient.post(ENDPOINTS.developers.logout, undefined, SESSION_REQUEST);
}

/**
 * Asks for a reset link by email. The server answers the same for a known and an unknown address,
 * so there is nothing to return.
 */
export async function requestPasswordReset({ email }) {
  await platformClient.post(ENDPOINTS.developers.passwordReset, { email: email.trim() }, FORM_REQUEST);
}

/** Sets the new password with the token from the emailed link. The token works once. */
export async function confirmPasswordReset({ token, password }) {
  await platformClient.post(ENDPOINTS.developers.passwordResetConfirm, { token, password }, FORM_REQUEST);
}

/** Pass `token` when the store does not hold the session yet (after login, on restore). */
export async function getCurrentDeveloper({ token, signal } = {}) {
  const raw = await platformClient.get(ENDPOINTS.developers.me, { token, signal });
  return mapDeveloper(raw);
}

// Admin sign-in lives here, not in features/admin: the session initializer restores both kinds
// of session, and a feature may not import another feature.
export async function loginAdmin({ email, password }) {
  const raw = await platformClient.post(
    ENDPOINTS.admin.login,
    { email: email.trim(), password },
    FORM_REQUEST,
  );
  return mapLoginResponse(raw);
}

/** Same as `getCurrentDeveloper`: pass `token` before the store holds the session. */
export async function getCurrentAdmin({ token, signal } = {}) {
  const raw = await platformClient.get(ENDPOINTS.admin.me, { token, signal });
  return mapAdmin(raw);
}
