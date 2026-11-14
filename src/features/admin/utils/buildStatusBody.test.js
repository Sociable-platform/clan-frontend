import { describe, expect, it } from 'vitest';

import { buildStatusBody } from './buildStatusBody';

describe('buildStatusBody', () => {
  it('sends the reason and the trimmed note when suspending', () => {
    expect(buildStatusBody({ status: 'suspended', reason: 'abuse', note: '  spam  ' })).toEqual({
      status: 'suspended',
      reason: 'abuse',
      note: 'spam',
    });
  });

  it('leaves a blank note out', () => {
    expect(buildStatusBody({ status: 'suspended', reason: 'other', note: '   ' })).toEqual({
      status: 'suspended',
      reason: 'other',
    });
  });

  it('sends only the status when resuming, even if a reason and note are passed', () => {
    expect(buildStatusBody({ status: 'active', reason: 'abuse', note: 'x' })).toEqual({ status: 'active' });
  });
});
