import { describe, expect, it } from 'vitest';

import { getSafeRedirectPath } from './redirect';

describe('getSafeRedirectPath', () => {
  it('keeps local paths', () => {
    expect(getSafeRedirectPath('/projects?x=1', '/')).toBe('/projects?x=1');
  });

  it.each(['//evil.example', 'https://evil.example', undefined, 42])('falls back for %s', (value) => {
    expect(getSafeRedirectPath(value, '/fallback')).toBe('/fallback');
  });
});
