import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, ENDPOINTS } from '@/shared/api';

import {
  loginDeveloper,
  logoutDeveloper,
  refreshDeveloperSession,
  registerDeveloper,
  resendRegistrationCode,
  verifyRegistration,
} from './authApi';

function stubFetch(status, payload) {
  const body = payload === undefined ? null : JSON.stringify(payload);
  const fetchMock = vi.fn().mockImplementation(async () => new Response(body, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('developer session requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs in with credentials, so the browser keeps the refresh cookie', async () => {
    const fetchMock = stubFetch(200, { token: 'jwt', expiresIn: 900 });

    const session = await loginDeveloper({ email: ' dev@example.com ', password: 'correct horse' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.endsWith(ENDPOINTS.developers.login)).toBe(true);
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body)).toEqual({ email: 'dev@example.com', password: 'correct horse' });
    expect(session.token).toBe('jwt');
  });

  it('refreshes with the cookie alone: no body', async () => {
    const fetchMock = stubFetch(200, { token: 'jwt-2', expiresIn: 900 });
    const before = Date.now();

    const session = await refreshDeveloperSession();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.endsWith(ENDPOINTS.developers.tokenRefresh)).toBe(true);
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(init.body).toBeUndefined();
    expect(session.token).toBe('jwt-2');
    expect(session.expiresAt).toBeGreaterThanOrEqual(before + 900_000);
  });

  it('rejects a refused refresh with the server error', async () => {
    stubFetch(401, { error: { code: 'invalid_refresh_token', message: 'Your session has ended. Log in again.' } });

    const error = await refreshDeveloperSession().catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('invalid_refresh_token');
  });

  it('logs out with credentials and accepts the empty 204', async () => {
    const fetchMock = stubFetch(204);

    await expect(logoutDeveloper()).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.endsWith(ENDPOINTS.developers.logout)).toBe(true);
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
  });
});

describe('registration requests', () => {
  const form = { name: ' Dev One ', email: ' dev@example.com ', password: 'correct horse' };
  const developer = { id: 'd1', email: 'dev@example.com', name: 'Dev One', status: 'active' };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports a created account when the backend answers with the developer', async () => {
    const fetchMock = stubFetch(201, developer);

    const result = await registerDeveloper(form);

    expect(result.needsVerification).toBe(false);
    expect(result.developer).toMatchObject({ id: 'd1', email: 'dev@example.com' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: 'Dev One',
      email: 'dev@example.com',
      password: 'correct horse',
    });
  });

  it('reports that a code is needed when the backend only says it sent one', async () => {
    stubFetch(202, { message: 'We sent a code to this email address.' });

    await expect(registerDeveloper(form)).resolves.toEqual({ needsVerification: true });
  });

  it('verifies with the trimmed email and code and returns the new developer', async () => {
    const fetchMock = stubFetch(201, developer);

    const created = await verifyRegistration({ email: ' dev@example.com ', code: ' 482913 ' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.endsWith(ENDPOINTS.developers.registerVerify)).toBe(true);
    expect(JSON.parse(init.body)).toEqual({ email: 'dev@example.com', code: '482913' });
    expect(created).toMatchObject({ id: 'd1', email: 'dev@example.com' });
  });

  it('asks for a new code for the email', async () => {
    const fetchMock = stubFetch(202, { message: 'ok' });

    await expect(resendRegistrationCode({ email: ' dev@example.com ' })).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.endsWith(ENDPOINTS.developers.registerResend)).toBe(true);
    expect(JSON.parse(init.body)).toEqual({ email: 'dev@example.com' });
  });
});
