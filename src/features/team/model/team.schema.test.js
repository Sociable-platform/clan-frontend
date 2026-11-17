import { describe, expect, it } from 'vitest';

import { TEAM_MESSAGES } from '../config/teamConfig';

import { validateInviteValues } from './team.schema';

describe('validateInviteValues', () => {
  it('accepts a plain address, with spaces around it', () => {
    expect(validateInviteValues({ email: ' carol@example.com ' })).toEqual({});
  });

  it('asks for an address', () => {
    expect(validateInviteValues({ email: '   ' })).toEqual({ email: TEAM_MESSAGES.EMAIL_REQUIRED });
  });

  it.each(['carol', 'carol@', '@example.com', 'carol@example', 'ca rol@example.com', 'a@b@c.com'])(
    'refuses %s',
    (email) => {
      expect(validateInviteValues({ email })).toEqual({ email: TEAM_MESSAGES.EMAIL_INVALID });
    },
  );

  it('refuses an address longer than the server accepts', () => {
    const email = `${'a'.repeat(250)}@example.com`;
    expect(validateInviteValues({ email })).toEqual({ email: TEAM_MESSAGES.EMAIL_TOO_LONG });
  });
});
