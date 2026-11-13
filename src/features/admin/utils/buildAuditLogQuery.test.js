import { describe, expect, it } from 'vitest';

import { buildAuditLogQuery } from './buildAuditLogQuery';

describe('buildAuditLogQuery', () => {
  it('sends nothing when there is no target and no cursor', () => {
    expect(buildAuditLogQuery()).toBe('');
  });

  it('adds the target and the cursor', () => {
    expect(buildAuditLogQuery({ targetId: 'd1', cursor: 'abc' })).toBe('?targetId=d1&cursor=abc');
  });

  it('encodes a cursor with reserved characters', () => {
    expect(buildAuditLogQuery({ cursor: 'a+b/c=' })).toBe('?cursor=a%2Bb%2Fc%3D');
  });
});
