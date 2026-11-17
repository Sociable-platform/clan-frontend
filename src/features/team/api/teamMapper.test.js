import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';

import { mapInvite, mapInviteList, mapMember, mapMemberList } from './teamMapper';

const RAW_MEMBER = {
  developerId: '7f1e0c2a-5b3d-4e8f-9a10-2b3c4d5e6f70',
  name: 'Ali',
  email: 'ali@example.com',
  role: 'owner',
  joinedAt: '2026-11-07T09:30:00Z',
};

const RAW_INVITE = {
  id: '5c2e8a10-7d3b-4f19-a6e4-3b9c1d0f8a27',
  email: 'carol@example.com',
  invitedByName: 'Ali',
  createdAt: '2026-11-17T10:00:00Z',
  expiresAt: '2026-11-24T10:00:00Z',
};

describe('teamMapper', () => {
  it('maps a member, with whether they are an owner', () => {
    expect(mapMember(RAW_MEMBER)).toEqual({ ...RAW_MEMBER, isOwner: true });
    expect(mapMember({ ...RAW_MEMBER, role: 'member' })).toMatchObject({ role: 'member', isOwner: false });
  });

  it('never makes an unknown role an owner', () => {
    expect(mapMember({ ...RAW_MEMBER, role: 'root' })).toMatchObject({ role: 'member', isOwner: false });
  });

  it('keeps the order the server sent: owners first', () => {
    const list = mapMemberList({ members: [RAW_MEMBER, { ...RAW_MEMBER, developerId: 'b', role: 'member' }] });
    expect(list.map((member) => member.role)).toEqual(['owner', 'member']);
  });

  it('maps an invitation of the owner\'s list', () => {
    expect(mapInvite(RAW_INVITE)).toEqual(RAW_INVITE);
    expect(mapInviteList({ invites: [RAW_INVITE] })).toEqual([RAW_INVITE]);
    expect(mapInviteList({ invites: [] })).toEqual([]);
  });

  it('rejects responses that are not what the contract says', () => {
    expect(() => mapMemberList({})).toThrow(ApiError);
    expect(() => mapMember({ name: 'No id' })).toThrow(ApiError);
    expect(() => mapInviteList({ invites: 'none' })).toThrow(ApiError);
    expect(() => mapInvite({ email: 'a@b.co' })).toThrow(ApiError);
  });
});
