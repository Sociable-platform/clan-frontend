import { describe, expect, it } from 'vitest';

import { GAMES_LIMITS, GAMES_MESSAGES } from '../config/gamesConfig';

import { validateGameValues } from './games.schema';

describe('validateGameValues', () => {
  it('accepts a name with no description', () => {
    expect(validateGameValues({ name: 'Space Raiders', description: '' })).toEqual({});
  });

  it('requires a name that is not only spaces', () => {
    expect(validateGameValues({ name: '   ', description: '' })).toEqual({
      name: GAMES_MESSAGES.NAME_REQUIRED,
    });
  });

  it('rejects a name over the limit', () => {
    const name = 'a'.repeat(GAMES_LIMITS.NAME_MAX + 1);
    expect(validateGameValues({ name, description: '' }).name).toBe(GAMES_MESSAGES.NAME_TOO_LONG);
  });

  it('rejects a description over the limit', () => {
    const description = 'a'.repeat(GAMES_LIMITS.DESCRIPTION_MAX + 1);
    expect(validateGameValues({ name: 'Game', description }).description).toBe(
      GAMES_MESSAGES.DESCRIPTION_TOO_LONG,
    );
  });
});
