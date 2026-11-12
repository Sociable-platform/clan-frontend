import { AUTH_LIMITS, AUTH_MESSAGES } from '../config/authMessages';

// Deliberately loose: the server is the authority on addresses. This only catches typos.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(rawEmail) {
  const email = rawEmail.trim();
  if (email === '') return AUTH_MESSAGES.EMAIL_REQUIRED;
  if (email.length > AUTH_LIMITS.EMAIL_MAX) return AUTH_MESSAGES.EMAIL_TOO_LONG;
  if (!EMAIL_PATTERN.test(email)) return AUTH_MESSAGES.EMAIL_INVALID;
  return null;
}

function withoutNulls(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message !== null));
}

/** Login only checks presence: an old password must never be rejected by new length rules. */
export function validateLoginValues({ email, password }) {
  return withoutNulls({
    email: validateEmail(email),
    password: password === '' ? AUTH_MESSAGES.PASSWORD_REQUIRED : null,
  });
}

export function validateRegisterValues({ name, email, password }) {
  let passwordError = null;
  if (password === '') passwordError = AUTH_MESSAGES.PASSWORD_REQUIRED;
  else if (password.length < AUTH_LIMITS.PASSWORD_MIN) passwordError = AUTH_MESSAGES.PASSWORD_TOO_SHORT;
  else if (password.length > AUTH_LIMITS.PASSWORD_MAX) passwordError = AUTH_MESSAGES.PASSWORD_TOO_LONG;

  const trimmedName = name.trim();
  let nameError = null;
  if (trimmedName.length < AUTH_LIMITS.NAME_MIN) nameError = AUTH_MESSAGES.NAME_REQUIRED;
  else if (trimmedName.length > AUTH_LIMITS.NAME_MAX) nameError = AUTH_MESSAGES.NAME_TOO_LONG;

  return withoutNulls({
    name: nameError,
    email: validateEmail(email),
    password: passwordError,
  });
}
