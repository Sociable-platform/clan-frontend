import { describe, expect, it } from 'vitest';

import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { TEAM_MESSAGES } from '../config/teamConfig';

import { describeTeamError, isGameNotFound, mapInviteError } from './teamErrors';

const apiError = (code, status = 409, message = 'server text') => new ApiError({ status, code, message });

describe('describeTeamError', () => {
  it('says clearly that only an owner can do this (403 owner_required)', () => {
    expect(describeTeamError(apiError('owner_required', 403))).toBe(TEAM_MESSAGES.OWNER_REQUIRED);
  });

  it('explains the last-owner rule', () => {
    expect(describeTeamError(apiError('last_owner'))).toBe(TEAM_MESSAGES.LAST_OWNER);
  });

  it('says when the developer or the invitation is gone already', () => {
    expect(describeTeamError(apiError('member_not_found', 404))).toBe(TEAM_MESSAGES.MEMBER_GONE);
    expect(describeTeamError(apiError('invite_not_found', 404))).toBe(TEAM_MESSAGES.INVITE_GONE);
  });

  it('keeps the network error\'s own text', () => {
    expect(describeTeamError(apiError(API_ERROR_CODES.NETWORK, 0, 'You appear to be offline'))).toBe('You appear to be offline');
  });

  it('uses the fallback of the action for anything else, and for what is not an ApiError', () => {
    expect(describeTeamError(apiError('internal_error', 500), 'Could not remove.')).toBe('Could not remove.');
    expect(describeTeamError(new Error('boom'), 'Could not remove.')).toBe('Could not remove.');
    expect(describeTeamError(null)).toBe(TEAM_MESSAGES.GENERIC_ERROR);
  });
});

describe('mapInviteError', () => {
  it('puts a bad address and somebody already on the game on the field', () => {
    expect(mapInviteError(apiError('invalid_email', 400))).toEqual({
      fieldErrors: { email: TEAM_MESSAGES.EMAIL_INVALID },
      formError: null,
    });
    expect(mapInviteError(apiError('already_member'))).toEqual({
      fieldErrors: { email: TEAM_MESSAGES.ALREADY_MEMBER },
      formError: null,
    });
  });

  it('shows the server\'s sentence for a rate limit: it says which limit was hit', () => {
    const mapped = mapInviteError(apiError('rate_limited', 429, 'This person was invited several times today.'));
    expect(mapped).toEqual({ fieldErrors: {}, formError: 'This person was invited several times today.' });
  });

  it('puts owner_required on the form', () => {
    expect(mapInviteError(apiError('owner_required', 403)).formError).toBe(TEAM_MESSAGES.OWNER_REQUIRED);
  });

  it('is generic for anything else', () => {
    expect(mapInviteError(new Error('boom'))).toEqual({ fieldErrors: {}, formError: TEAM_MESSAGES.GENERIC_ERROR });
  });
});

describe('isGameNotFound', () => {
  it('is the 404 game_not_found only', () => {
    expect(isGameNotFound(apiError('game_not_found', 404))).toBe(true);
    expect(isGameNotFound(apiError('member_not_found', 404))).toBe(false);
    expect(isGameNotFound(undefined)).toBe(false);
  });
});
