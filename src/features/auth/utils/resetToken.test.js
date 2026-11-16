import { describe, expect, it } from 'vitest';

import { readResetToken } from './resetToken';

describe('readResetToken', () => {
  it('reads the token from the fragment of a reset link', () => {
    expect(readResetToken('#token=abc-DEF_123')).toBe('abc-DEF_123');
  });

  it.each(['', '#', '#other=1', '#token=', undefined, null])('returns an empty string for %j', (hash) => {
    expect(readResetToken(hash)).toBe('');
  });
});
