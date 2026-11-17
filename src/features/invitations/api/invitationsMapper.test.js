import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';

import { mapInvitation, mapInvitationList } from './invitationsMapper';

const RAW = {
  id: '5c2e8a10-7d3b-4f19-a6e4-3b9c1d0f8a27',
  gameId: '0d6f2c0e-5b1a-4f5e-8f55-2f4f0c7a9b11',
  gameName: 'Space Raiders',
  invitedByName: 'Ali',
  createdAt: '2026-11-17T10:00:00Z',
  expiresAt: '2026-11-24T10:00:00Z',
};

describe('invitationsMapper', () => {
  it('maps an invitation of the inbox', () => {
    expect(mapInvitation(RAW)).toEqual(RAW);
  });

  it('unwraps the list, newest first as the server sends it, and an empty one', () => {
    expect(mapInvitationList({ invites: [RAW, { ...RAW, id: 'b' }] }).map((i) => i.id)).toEqual([RAW.id, 'b']);
    expect(mapInvitationList({ invites: [] })).toEqual([]);
  });

  it('rejects responses that are not what the contract says', () => {
    expect(() => mapInvitationList({})).toThrow(ApiError);
    expect(() => mapInvitation({ gameName: 'No ids' })).toThrow(ApiError);
  });
});
