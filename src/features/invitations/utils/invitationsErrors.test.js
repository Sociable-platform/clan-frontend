import { describe, expect, it } from 'vitest';

import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { INVITATIONS_MESSAGES } from '../config/invitationsConfig';

import { describeInvitationError } from './invitationsErrors';

const apiError = (code, status, message = 'server text') => new ApiError({ status, code, message });

describe('describeInvitationError', () => {
  it('says the invitation is gone (404 invite_not_found: cancelled, or not for this account)', () => {
    expect(describeInvitationError(apiError('invite_not_found', 404))).toBe(INVITATIONS_MESSAGES.INVITE_GONE);
  });

  it('says the invitation expired (410 invite_expired) and what to do', () => {
    expect(describeInvitationError(apiError('invite_expired', 410))).toBe(INVITATIONS_MESSAGES.INVITE_EXPIRED);
  });

  it('keeps the network error\'s text and is generic otherwise', () => {
    expect(describeInvitationError(apiError(API_ERROR_CODES.NETWORK, 0, 'You appear to be offline'))).toBe('You appear to be offline');
    expect(describeInvitationError(apiError('internal_error', 500))).toBe(INVITATIONS_MESSAGES.GENERIC_ERROR);
    expect(describeInvitationError(new Error('boom'))).toBe(INVITATIONS_MESSAGES.GENERIC_ERROR);
  });
});
