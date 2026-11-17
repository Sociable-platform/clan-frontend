import { ENDPOINTS, platformClient } from '@/shared/api';

import { mapAdmin, mapDeveloper, mapLoginResponse } from './authMapper';

// A wrong password or a taken email is a form error, not an expired session,
// so these calls opt out of the 401 handler.
const FORM_REQUEST = { skipAuthHandling: true };

// The developer session requests (login, token refresh, logout) send and receive the refresh
// cookie. They also opt out of the 401 handler: a refused refresh is handled by whoever asked.
const SESSION_REQUEST = { skipAuthHandling: true, withCredentials: true };

/**
 * Registers. A backend without email verification creates the account and answers with it:
 * `{ needsVerification: false, developer }`. With email verification on it creates nothing yet and
 * emails a code instead: `{ needsVerification: true }`, and `verifyRegistration` finishes the job.
 */
export async function registerDeveloper({ name, email, password }) {
  const raw = await platformClient.post(
    ENDPOINTS.developers.register,
    { name: name.trim(), email: email.trim(), password },
    FORM_REQUEST,
  );
  // Only a created account has an id; the "code sent" answer is `{ message }`.
  if (typeof raw?.id !== 'string') return { needsVerification: true };
  return { needsVerification: false, developer: mapDeveloper(raw) };
}

/** Finishes a registration with the 6-digit code from the email. Resolves to the new developer. */
export async function verifyRegistration({ email, code }) {
  const raw = await platformClient.post(
    ENDPOINTS.developers.registerVerify,
    { email: email.trim(), code: code.trim() },
    FORM_REQUEST,
  );
  return mapDeveloper(raw);
}

/**
 * Asks for a new code. The server answers the same whether or not a registration is waiting for
 * the address, so there is nothing to return.
 */
export async function resendRegistrationCode({ email }) {
  await platformClient.post(ENDPOINTS.developers.registerResend, { email: email.trim() }, FORM_REQUEST);
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
