export const AUTH_LIMITS = {
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72, // bcrypt limit, same as the backend
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
};
