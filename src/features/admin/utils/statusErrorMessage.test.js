import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';

import { STATUS_MESSAGES } from '../config/adminConfig';

import { statusErrorMessage } from './statusErrorMessage';

const apiError = (code, status = 400) => new ApiError({ status, code, message: 'x' });

describe('statusErrorMessage', () => {
  it.each(['developer_not_found', 'game_not_found'])('says it no longer exists for %s', (code) => {
    expect(statusErrorMessage(apiError(code, 404))).toBe(STATUS_MESSAGES.ERROR_NOT_FOUND);
  });

  it.each(['reason_required', 'invalid_reason', 'invalid_note', 'invalid_status'])(
    'says the reason or note was refused for %s',
    (code) => {
      expect(statusErrorMessage(apiError(code))).toBe(STATUS_MESSAGES.ERROR_REJECTED);
    },
  );

  it('says the server could not be reached for a network failure', () => {
    expect(statusErrorMessage(apiError('network_error', 0))).toBe(STATUS_MESSAGES.ERROR_NETWORK);
  });

  it('falls back to a generic message that says nothing changed', () => {
    expect(statusErrorMessage(apiError('internal_error', 500))).toBe(STATUS_MESSAGES.ERROR_GENERIC);
    expect(statusErrorMessage(new Error('boom'))).toBe(STATUS_MESSAGES.ERROR_GENERIC);
    expect(STATUS_MESSAGES.ERROR_GENERIC).toMatch(/nothing was changed/i);
  });
});
