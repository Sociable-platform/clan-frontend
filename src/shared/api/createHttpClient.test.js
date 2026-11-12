import { describe, expect, it, vi } from 'vitest';

import { ApiError } from './ApiError';
import { createHttpClient } from './createHttpClient';

function stubFetch(status, payload) {
  const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(payload), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('createHttpClient', () => {
  it('prefers an explicit token over the registered one', async () => {
    const fetchMock = stubFetch(200, {});
    const client = createHttpClient({ baseUrl: 'http://api', getToken: () => 'stored' });

    await client.get('/me', { token: 'explicit' });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer explicit');
  });

  it('calls onUnauthorized for a 401 unless the request opts out', async () => {
    stubFetch(401, { error: { code: 'unauthorized', message: 'No' } });
    const onUnauthorized = vi.fn();
    const client = createHttpClient({ baseUrl: 'http://api', onUnauthorized });

    await expect(client.get('/me')).rejects.toBeInstanceOf(ApiError);
    await expect(client.post('/login', {}, { skipAuthHandling: true })).rejects.toBeInstanceOf(ApiError);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('copies validation details from the error body', async () => {
    const details = [{ path: '/clan/maxMembers', rule: 'maximum' }];
    stubFetch(400, { error: { code: 'invalid_widget_config', message: 'Invalid', details } });
    const client = createHttpClient({ baseUrl: 'http://api' });

    const error = await client.put('/draft', {}).catch((caught) => caught);

    expect(error.details).toEqual(details);
  });

  it('defaults details to an empty array when the server sends none', async () => {
    stubFetch(500, { error: { code: 'internal', message: 'Boom' } });
    const client = createHttpClient({ baseUrl: 'http://api' });

    const error = await client.get('/x').catch((caught) => caught);

    expect(error.details).toEqual([]);
  });
});
