import { describe, expect, it } from 'vitest';

import { buildDevelopersQuery } from './buildDevelopersQuery';

describe('buildDevelopersQuery', () => {
  it('is empty without filters', () => {
    expect(buildDevelopersQuery()).toBe('');
    expect(buildDevelopersQuery({ q: '', status: '', cursor: null })).toBe('');
  });

  it('trims the search and ignores a blank one', () => {
    expect(buildDevelopersQuery({ q: '  ann  ' })).toBe('?q=ann');
    expect(buildDevelopersQuery({ q: '   ' })).toBe('');
  });

  it('adds the status and the cursor', () => {
    expect(buildDevelopersQuery({ q: 'ann', status: 'suspended', cursor: 'c1' })).toBe(
      '?q=ann&status=suspended&cursor=c1',
    );
  });

  it('encodes characters that would break the URL', () => {
    expect(buildDevelopersQuery({ q: 'a&b=c d@x.io', cursor: 'a+b/c=' })).toBe(
      '?q=a%26b%3Dc+d%40x.io&cursor=a%2Bb%2Fc%3D',
    );
  });
});
