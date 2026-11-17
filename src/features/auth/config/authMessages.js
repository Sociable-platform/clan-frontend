export const AUTH_LIMITS = {
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72, // bcrypt limit, same as the backend
  VERIFICATION_CODE_LENGTH: 6,
  NAME_MIN: 1,
  NAME_MAX: 100,
};

// Backend error codes this feature gives a specific meaning (openapi/platform.yaml).
export const AUTH_ERROR_CODES = {
  INVALID_EMAIL: 'invalid_email',
  INVALID_PASSWORD: 'invalid_password',
  INVALID_NAME: 'invalid_name',
  EMAIL_TAKEN: 'email_taken',
  INVALID_CREDENTIALS: 'invalid_credentials',
  INVALID_RESET_TOKEN: 'invalid_reset_token',
  INVALID_VERIFICATION_CODE: 'invalid_verification_code',
  VERIFICATION_ATTEMPTS_EXCEEDED: 'verification_attempts_exceeded',
  RATE_LIMITED: 'rate_limited',
};

export const AUTH_MESSAGES = {
  EMAIL_REQUIRED: 'Enter your email address',
  EMAIL_INVALID: 'Enter a valid email address',
  EMAIL_TOO_LONG: `Use at most ${AUTH_LIMITS.EMAIL_MAX} characters`,
  PASSWORD_REQUIRED: 'Enter your password',
  PASSWORD_TOO_SHORT: `Use at least ${AUTH_LIMITS.PASSWORD_MIN} characters`,
  PASSWORD_TOO_LONG: `Use at most ${AUTH_LIMITS.PASSWORD_MAX} characters`,
  NAME_REQUIRED: 'Enter your name',
  NAME_TOO_LONG: `Use at most ${AUTH_LIMITS.NAME_MAX} characters`,
  GENERIC_ERROR: 'Something went wrong. Try again.',
  REGISTERED: 'Account created. Log in to continue.',
  CODE_REQUIRED: 'Enter the 6-digit code from the email',
  CODE_RESENT: 'A new code is on its way. The earlier one no longer works.',
  NEW_PASSWORD_REQUIRED: 'Enter a new password',
  PASSWORDS_DIFFER: 'The two passwords are not the same',
  PASSWORD_CHANGED: 'Password changed. Log in with your new password.',
};
