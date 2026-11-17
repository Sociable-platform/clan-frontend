import { afterEach, describe, expect, it, vi } from 'vitest';

import { ENDPOINTS } from '@/shared/api';

import {
  cancelInvite,
  inviteToGame,
  leaveGame,
  listGameInvites,
  listMembers,
  removeMember,
  transferOwnership,
} from './teamApi';

function stubFetch(status, payload) {
  const body = payload === undefined ? null : JSON.stringify(payload);
  const fetchMock = vi.fn().mockImplementation(async () => new Response(body, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const GAME = '0d6f2c0e-5b1a-4f5e-8f55-2f4f0c7a9b11';
const DEVELOPER = '7f1e0c2a-5b3d-4e8f-9a10-2b3c4d5e6f70';
const INVITE = '5c2e8a10-7d3b-4f19-a6e4-3b9c1d0f8a27';

const lastCall = (fetchMock) => {
  const [url, init] = fetchMock.mock.calls.at(-1);
  return { path: new URL(url).pathname, method: init.method, body: init.body ? JSON.parse(init.body) : undefined };
};

describe('team requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the team of a game', async () => {
    const fetchMock = stubFetch(200, { members: [] });

    await expect(listMembers({ gameId: GAME })).resolves.toEqual([]);

    expect(lastCall(fetchMock)).toMatchObject({ path: `/api/v1/games/${GAME}/members`, method: 'GET' });
  });

  it('lists the pending invitations of a game', async () => {
    const fetchMock = stubFetch(200, { invites: [] });

    await expect(listGameInvites({ gameId: GAME })).resolves.toEqual([]);

    expect(lastCall(fetchMock)).toMatchObject({ path: `/api/v1/games/${GAME}/invites`, method: 'GET' });
  });

  it('invites an address: only the email is sent, trimmed; the game is in the path', async () => {
    const fetchMock = stubFetch(201, {
      id: INVITE,
      email: 'carol@example.com',
      invitedByName: 'Ali',
      createdAt: '2026-11-17T10:00:00Z',
      expiresAt: '2026-11-24T10:00:00Z',
    });

    const invite = await inviteToGame({ gameId: GAME, email: '  carol@example.com ' });

    expect(lastCall(fetchMock)).toEqual({
      path: `/api/v1/games/${GAME}/invites`,
      method: 'POST',
      body: { email: 'carol@example.com' },
    });
    expect(invite.id).toBe(INVITE);
  });

  it('cancels an invitation, removes a member, transfers the game and leaves it', async () => {
    const fetchMock = stubFetch(204);

    await cancelInvite({ gameId: GAME, inviteId: INVITE });
    expect(lastCall(fetchMock)).toMatchObject({ path: `/api/v1/games/${GAME}/invites/${INVITE}`, method: 'DELETE' });

    await removeMember({ gameId: GAME, developerId: DEVELOPER });
    expect(lastCall(fetchMock)).toMatchObject({ path: `/api/v1/games/${GAME}/members/${DEVELOPER}`, method: 'DELETE' });

    await transferOwnership({ gameId: GAME, developerId: DEVELOPER });
    expect(lastCall(fetchMock)).toEqual({
      path: `/api/v1/games/${GAME}/transfer-ownership`,
      method: 'POST',
      body: { developerId: DEVELOPER },
    });

    await leaveGame({ gameId: GAME });
    expect(lastCall(fetchMock)).toMatchObject({ path: `/api/v1/games/${GAME}/leave`, method: 'POST' });
  });

  it('puts ids through the endpoint builders, which escape them', () => {
    expect(ENDPOINTS.games.member('a/b', 'c d')).toBe('/api/v1/games/a%2Fb/members/c%20d');
  });
});
