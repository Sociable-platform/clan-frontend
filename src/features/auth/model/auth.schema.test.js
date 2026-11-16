import { describe, expect, it } from 'vitest';

import { AUTH_MESSAGES } from '../config/authMessages';

import {
  validateForgotPasswordValues,
  validateLoginValues,
  validateRegisterValues,
  validateResetPasswordValues,
} from './auth.schema';

describe('validateLoginValues', () => {
  it('accepts an email and any non-empty password', () => {
    expect(validateLoginValues({ email: ' dev@example.com ', password: 'x' })).toEqual({});
  });

  it('requires both fields', () => {
    expect(validateLoginValues({ email: '  ', password: '' })).toEqual({
      email: AUTH_MESSAGES.EMAIL_REQUIRED,
      password: AUTH_MESSAGES.PASSWORD_REQUIRED,
    });
  });

  it('rejects a malformed email', () => {
    expect(validateLoginValues({ email: 'dev@', password: 'x' })).toEqual({
      email: AUTH_MESSAGES.EMAIL_INVALID,
    });
  });
});

describe('validateRegisterValues', () => {
  const valid = { name: 'Dev One', email: 'dev@example.com', password: 'correct horse' };

  it('accepts valid values', () => {
    expect(validateRegisterValues(valid)).toEqual({});
  });

  it('enforces the backend password bounds (8 to 72)', () => {
    expect(validateRegisterValues({ ...valid, password: 'a'.repeat(7) }).password).toBe(
      AUTH_MESSAGES.PASSWORD_TOO_SHORT,
    );
    expect(validateRegisterValues({ ...valid, password: 'a'.repeat(8) })).toEqual({});
    expect(validateRegisterValues({ ...valid, password: 'a'.repeat(72) })).toEqual({});
    expect(validateRegisterValues({ ...valid, password: 'a'.repeat(73) }).password).toBe(
      AUTH_MESSAGES.PASSWORD_TOO_LONG,
    );
  });

  it('enforces the name bounds (1 to 100 after trimming)', () => {
    expect(validateRegisterValues({ ...valid, name: '   ' }).name).toBe(AUTH_MESSAGES.NAME_REQUIRED);
    expect(validateRegisterValues({ ...valid, name: 'n'.repeat(101) }).name).toBe(
      AUTH_MESSAGES.NAME_TOO_LONG,
    );
  });
});

describe('validateForgotPasswordValues', () => {
  it('accepts an email address', () => {
    expect(validateForgotPasswordValues({ email: ' dev@example.com ' })).toEqual({});
  });

  it('requires a valid email address', () => {
    expect(validateForgotPasswordValues({ email: '' }).email).toBe(AUTH_MESSAGES.EMAIL_REQUIRED);
    expect(validateForgotPasswordValues({ email: 'nope' }).email).toBe(AUTH_MESSAGES.EMAIL_INVALID);
  });
});

describe('validateResetPasswordValues', () => {
  it('accepts a valid password typed twice', () => {
    expect(validateResetPasswordValues({ password: 'a brand new one', confirmPassword: 'a brand new one' })).toEqual({});
  });

  it('enforces the backend password bounds (8 to 72)', () => {
    const twice = (password) => ({ password, confirmPassword: password });
    expect(validateResetPasswordValues(twice('')).password).toBe(AUTH_MESSAGES.NEW_PASSWORD_REQUIRED);
    expect(validateResetPasswordValues(twice('a'.repeat(7))).password).toBe(AUTH_MESSAGES.PASSWORD_TOO_SHORT);
    expect(validateResetPasswordValues(twice('a'.repeat(73))).password).toBe(AUTH_MESSAGES.PASSWORD_TOO_LONG);
  });

  it('wants the same password twice, once the password itself is fine', () => {
    expect(validateResetPasswordValues({ password: 'a brand new one', confirmPassword: 'a brand new two' })).toEqual({
      confirmPassword: AUTH_MESSAGES.PASSWORDS_DIFFER,
    });
    expect(validateResetPasswordValues({ password: 'short', confirmPassword: 'other' })).toEqual({
      password: AUTH_MESSAGES.PASSWORD_TOO_SHORT,
    });
  });
});
