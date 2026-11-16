import { describe, expect, it, vi } from 'vitest';

import { ApiError } from './ApiError';
import { createHttpClient } from './createHttpClient';

function stubFetch(status, payload) {
  const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(payload), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('createHttpClient', () => {
  it('sends cookies only when the request asks for it', async () => {
    const fetchMock = stubFetch(200, {});
    const client = createHttpClient({ baseUrl: 'http://api' });

    await client.get('/games');
    await client.post('/login', {}, { withCredentials: true });

    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('credentials');
    expect(fetchMock.mock.calls[1][1].credentials).toBe('include');
  });

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

  it('calls onAccountSuspended once for a 403 account_suspended, and still throws', async () => {
    stubFetch(403, { error: { code: 'account_suspended', message: 'Suspended' } });
    const onAccountSuspended = vi.fn();
    const client = createHttpClient({ baseUrl: 'http://api', onAccountSuspended });

    const error = await client.post('/games', {}).catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('account_suspended');
    expect(onAccountSuspended).toHaveBeenCalledTimes(1);
    expect(onAccountSuspended).toHaveBeenCalledWith(error);
  });

  it('does not treat other 403s as a suspension', async () => {
    stubFetch(403, { error: { code: 'origin_not_allowed', message: 'No' } });
    const onAccountSuspended = vi.fn();
    const client = createHttpClient({ baseUrl: 'http://api', onAccountSuspended });

    await expect(client.get('/x')).rejects.toBeInstanceOf(ApiError);

    expect(onAccountSuspended).not.toHaveBeenCalled();
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

  describe('refreshing an expired token', () => {
    const UNAUTHORIZED = { error: { code: 'unauthorized', message: 'A valid developer token is required' } };

    /** A fetch that answers 401 unless the request carries `Bearer <goodToken>`. */
    function stubFetchAccepting(goodToken) {
      const fetchMock = vi.fn().mockImplementation(async (_url, init) =>
        init.headers.Authorization === `Bearer ${goodToken}`
          ? new Response(JSON.stringify({ ok: true }), { status: 200 })
          : new Response(JSON.stringify(UNAUTHORIZED), { status: 401 }),
      );
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    }

    /** A client whose token is replaced by what `refreshToken` resolves to, like the real session. */
    function clientWithSession(refreshToken, onUnauthorized = vi.fn()) {
      const session = { token: 'expired' };
      const refresh = vi.fn(async () => {
        const next = await refreshToken();
        if (next) session.token = next;
        return next;
      });
      const client = createHttpClient({
        baseUrl: 'http://api',
        getToken: () => session.token,
        refreshToken: refresh,
        onUnauthorized,
      });
      return { client, refresh, onUnauthorized, session };
    }

    it('refreshes after a 401 and sends the request again with the new token', async () => {
      const fetchMock = stubFetchAccepting('fresh');
      const { client, refresh, onUnauthorized } = clientWithSession(async () => 'fresh');

      await expect(client.put('/draft', { a: 1 })).resolves.toEqual({ ok: true });

      expect(refresh).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const [first, second] = fetchMock.mock.calls.map(([, init]) => init);
      expect(first.headers.Authorization).toBe('Bearer expired');
      expect(second.headers.Authorization).toBe('Bearer fresh');
      // The repeated request is the same request.
      expect(second.method).toBe('PUT');
      expect(second.body).toBe(JSON.stringify({ a: 1 }));
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('shares one refresh between requests that fail together', async () => {
      stubFetchAccepting('fresh');
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      const { client, refresh } = clientWithSession(async () => {
        await gate;
        return 'fresh';
      });

      const all = Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
      await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
      release();

      await expect(all).resolves.toEqual([{ ok: true }, { ok: true }, { ok: true }]);
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('uses a token that another request already refreshed, without refreshing again', async () => {
      const fetchMock = stubFetchAccepting('fresh');
      const { client, refresh, session } = clientWithSession(async () => 'never');
      // The token changes while the first attempt is on its way.
      fetchMock.mockImplementationOnce(async () => {
        session.token = 'fresh';
        return new Response(JSON.stringify(UNAUTHORIZED), { status: 401 });
      });

      await expect(client.get('/a')).resolves.toEqual({ ok: true });

      expect(refresh).not.toHaveBeenCalled();
    });

    it('gives up when the session cannot be continued', async () => {
      const fetchMock = stubFetchAccepting('fresh');
      const { client, refresh, onUnauthorized } = clientWithSession(async () => null);

      const error = await client.get('/a').catch((caught) => caught);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(401);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('repeats the request once only: a second 401 ends the session', async () => {
      const fetchMock = stubFetchAccepting('fresh');
      const { client, refresh, onUnauthorized } = clientWithSession(async () => 'still-bad');

      await expect(client.get('/a')).rejects.toBeInstanceOf(ApiError);

      expect(refresh).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    it('keeps the session when the refresh could not be tried', async () => {
      stubFetchAccepting('fresh');
      const { client, onUnauthorized } = clientWithSession(async () => {
        throw new ApiError({ status: 0, code: 'network_error', message: 'Down' });
      });

      const error = await client.get('/a').catch((caught) => caught);

      expect(error.status).toBe(401);
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('can refresh again later: a finished refresh is not reused', async () => {
      stubFetchAccepting('second');
      const tokens = ['first', 'second'];
      const { client, refresh } = clientWithSession(async () => tokens.shift());

      await expect(client.get('/a')).rejects.toBeInstanceOf(ApiError); // 'first' is refused too
      await expect(client.get('/a')).resolves.toEqual({ ok: true });

      expect(refresh).toHaveBeenCalledTimes(2);
    });

    it('never refreshes a request with its own token or one that opted out', async () => {
      stubFetchAccepting('fresh');
      const { client, refresh, onUnauthorized } = clientWithSession(async () => 'fresh');

      await expect(client.get('/me', { token: 'explicit' })).rejects.toBeInstanceOf(ApiError);
      await expect(client.post('/login', {}, { skipAuthHandling: true })).rejects.toBeInstanceOf(ApiError);

      expect(refresh).not.toHaveBeenCalled();
      // As before: the first counts as unauthorized, the opted-out one does not.
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });
  });
});
