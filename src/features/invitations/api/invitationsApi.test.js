import { afterEach, describe, expect, it, vi } from 'vitest';

import { acceptInvitation, declineInvitation, listInvitations } from './invitationsApi';

function stubFetch(status, payload) {
  const body = payload === undefined ? null : JSON.stringify(payload);
  const fetchMock = vi.fn().mockImplementation(async () => new Response(body, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const INVITE = '5c2e8a10-7d3b-4f19-a6e4-3b9c1d0f8a27';
const lastCall = (fetchMock) => {
  const [url, init] = fetchMock.mock.calls.at(-1);
  return { path: new URL(url).pathname, method: init.method, hasBody: init.body !== undefined && init.body !== null };
};

describe('invitation requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the invitations of the signed-in developer', async () => {
    const fetchMock = stubFetch(200, { invites: [] });

    await expect(listInvitations()).resolves.toEqual([]);

    expect(lastCall(fetchMock)).toMatchObject({ path: '/api/v1/invites', method: 'GET' });
  });

  it('accepts and declines with the invitation id in the path and no body', async () => {
    const fetchMock = stubFetch(200, { id: 'g1', name: 'Space Raiders' });
    await acceptInvitation({ inviteId: INVITE });
    expect(lastCall(fetchMock)).toEqual({ path: `/api/v1/invites/${INVITE}/accept`, method: 'POST', hasBody: false });

    stubFetch(204);
    const declineFetch = stubFetch(204);
    await declineInvitation({ inviteId: INVITE });
    expect(lastCall(declineFetch)).toEqual({ path: `/api/v1/invites/${INVITE}/decline`, method: 'POST', hasBody: false });
  });
});
