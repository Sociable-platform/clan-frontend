import { describe, expect, it } from 'vitest';

import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { AUTH_MESSAGES } from '../config/authMessages';

import {
  mapForgotPasswordError,
  mapLoginError,
  mapRegisterError,
  mapResetPasswordError,
} from './authErrors';

const apiError = (status, code, message) => new ApiError({ status, code, message });

describe('mapRegisterError', () => {
  it.each([
    ['invalid_email', 'email'],
    ['email_taken', 'email'],
    ['invalid_password', 'password'],
    ['invalid_name', 'name'],
  ])('puts %s on the %s field', (code, field) => {
    const result = mapRegisterError(apiError(400, code, 'Server text'));
    expect(result).toEqual({ fieldErrors: { [field]: 'Server text' }, formError: null });
  });

  it('shows network errors as a form error with their own message', () => {
    const result = mapRegisterError(apiError(0, API_ERROR_CODES.NETWORK, 'Cannot reach the server'));
    expect(result).toEqual({ fieldErrors: {}, formError: 'Cannot reach the server' });
  });

  it('hides raw status text for unknown errors', () => {
    const result = mapRegisterError(apiError(500, 'internal', 'Request failed with status 500'));
    expect(result.formError).toBe(AUTH_MESSAGES.GENERIC_ERROR);
  });
});

describe('mapLoginError', () => {
  it('shows invalid credentials as a form error', () => {
    const result = mapLoginError(apiError(401, 'invalid_credentials', 'Email or password is wrong'));
    expect(result).toEqual({ fieldErrors: {}, formError: 'Email or password is wrong' });
  });

  it('falls back to the generic message for non-API errors', () => {
    expect(mapLoginError(new Error('boom')).formError).toBe(AUTH_MESSAGES.GENERIC_ERROR);
  });
});

describe('mapForgotPasswordError', () => {
  it('puts a refused address on the email field', () => {
    const result = mapForgotPasswordError(apiError(400, 'invalid_email', 'Server text'));
    expect(result).toEqual({ fieldErrors: { email: 'Server text' }, formError: null });
  });

  it('shows too many attempts with the server text', () => {
    const result = mapForgotPasswordError(apiError(429, 'rate_limited', 'Too many attempts'));
    expect(result).toEqual({ fieldErrors: {}, formError: 'Too many attempts' });
  });

  it('hides raw status text for unknown errors', () => {
    const result = mapForgotPasswordError(apiError(500, 'internal', 'Request failed with status 500'));
    expect(result.formError).toBe(AUTH_MESSAGES.GENERIC_ERROR);
  });
});

describe('mapResetPasswordError', () => {
  it('puts a refused password on its field', () => {
    const result = mapResetPasswordError(apiError(400, 'invalid_password', 'Server text'));
    expect(result).toEqual({ fieldErrors: { password: 'Server text' }, formError: null });
  });

  it.each(['invalid_reset_token', 'rate_limited'])('shows %s with the server text', (code) => {
    const result = mapResetPasswordError(apiError(400, code, 'Server text'));
    expect(result).toEqual({ fieldErrors: {}, formError: 'Server text' });
  });

  it('hides raw status text for unknown errors', () => {
    expect(mapResetPasswordError(new Error('boom')).formError).toBe(AUTH_MESSAGES.GENERIC_ERROR);
  });
});
