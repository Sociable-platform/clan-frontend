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

/** A password being chosen (register, reset) must fit the backend's bounds. */
function validateNewPassword(password, requiredMessage) {
  if (password === '') return requiredMessage;
  if (password.length < AUTH_LIMITS.PASSWORD_MIN) return AUTH_MESSAGES.PASSWORD_TOO_SHORT;
  if (password.length > AUTH_LIMITS.PASSWORD_MAX) return AUTH_MESSAGES.PASSWORD_TOO_LONG;
  return null;
}

const VERIFICATION_CODE_PATTERN = new RegExp(`^\\d{${AUTH_LIMITS.VERIFICATION_CODE_LENGTH}}$`);

/** The code from the verification email: exactly six digits (spaces around it are ignored). */
export function validateVerificationCode({ code }) {
  return withoutNulls({
    code: VERIFICATION_CODE_PATTERN.test(code.trim()) ? null : AUTH_MESSAGES.CODE_REQUIRED,
  });
}

/** The forgot-password form has one field. */
export function validateForgotPasswordValues({ email }) {
  return withoutNulls({ email: validateEmail(email) });
}

/** The new password follows the register rules and is typed twice to catch a typo. */
export function validateResetPasswordValues({ password, confirmPassword }) {
  const passwordError = validateNewPassword(password, AUTH_MESSAGES.NEW_PASSWORD_REQUIRED);
  return withoutNulls({
    password: passwordError,
    confirmPassword:
      passwordError === null && confirmPassword !== password ? AUTH_MESSAGES.PASSWORDS_DIFFER : null,
  });
}

export function validateRegisterValues({ name, email, password }) {
  const passwordError = validateNewPassword(password, AUTH_MESSAGES.PASSWORD_REQUIRED);

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
