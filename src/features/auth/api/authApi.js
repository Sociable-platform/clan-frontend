import { ENDPOINTS, platformClient } from '@/shared/api';

import { mapDeveloper, mapLoginResponse } from './authMapper';

// A wrong password or a taken email is a form error, not an expired session,
// so these calls opt out of the 401 handler.
const FORM_REQUEST = { skipAuthHandling: true };

export async function registerDeveloper({ name, email, password }) {
  const raw = await platformClient.post(
    ENDPOINTS.developers.register,
    { name: name.trim(), email: email.trim(), password },
    FORM_REQUEST,
  );
  return mapDeveloper(raw);
}

export async function loginDeveloper({ email, password }) {
  const raw = await platformClient.post(
    ENDPOINTS.developers.login,
    { email: email.trim(), password },
    FORM_REQUEST,
  );
  return mapLoginResponse(raw);
}

/** Pass `token` when the store does not hold the session yet (after login, on restore). */
export async function getCurrentDeveloper({ token, signal } = {}) {
  const raw = await platformClient.get(ENDPOINTS.developers.me, { token, signal });
  return mapDeveloper(raw);
}
