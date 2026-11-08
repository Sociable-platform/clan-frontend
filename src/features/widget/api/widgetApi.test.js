import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildWidgetConfig } from '@/test/builders';

import {
  getWidgetDraft,
  getWidgetVersion,
  listWidgetVersions,
  publishWidget,
  rollbackWidget,
  saveWidgetDraft,
} from './widgetApi';

const GAME_ID = '7f3a2c10-5b8e-4d21-9a47-0c6e1b2d3f45';
const DRAFT_PATH = `/api/v1/games/${GAME_ID}/widget/draft`;

function stubFetch(status, payload) {
  const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(payload), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('widgetApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the draft from the game endpoint and returns a complete config', async () => {
    const fetchMock = stubFetch(200, { config: { schemaVersion: 1 }, updatedAt: null });

    const config = await getWidgetDraft({ gameId: GAME_ID });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(new RegExp(`${DRAFT_PATH}$`));
    expect(init.method).toBe('GET');
    expect(config.game_id).toBe(GAME_ID);
    expect(config.theme.mode).toBe('dark');
  });

  it('saves the config inside a { config } body with PUT', async () => {
    const config = buildWidgetConfig();
    const fetchMock = stubFetch(200, { config, updatedAt: '2026-11-08T12:00:00Z' });

    await saveWidgetDraft({ gameId: GAME_ID, config });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(new RegExp(`${DRAFT_PATH}$`));
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ config });
  });

  describe('publishing and versions', () => {
    const VERSION = { version: 3, publishedAt: '2026-11-08T12:00:00Z', publishedBy: 'dev-1', config: { schemaVersion: 1 } };
    const BASE = `/api/v1/games/${GAME_ID}/widget`;

    it('publishes with a POST and no body, and returns the new version', async () => {
      const fetchMock = stubFetch(201, VERSION);

      const published = await publishWidget({ gameId: GAME_ID });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toMatch(new RegExp(`${BASE}/publish$`));
      expect(init.method).toBe('POST');
      expect(init.body).toBeUndefined();
      expect(published).toEqual(VERSION);
    });

    it('lists the versions, newest first', async () => {
      const summary = (version) => ({ version, publishedAt: '2026-11-08T12:00:00Z', publishedBy: 'dev-1' });
      const fetchMock = stubFetch(200, { versions: [summary(1), summary(2)] });

      const versions = await listWidgetVersions({ gameId: GAME_ID });

      expect(fetchMock.mock.calls[0][0]).toMatch(new RegExp(`${BASE}/versions$`));
      expect(versions.map((version) => version.version)).toEqual([2, 1]);
    });

    it('reads one version with its config', async () => {
      const fetchMock = stubFetch(200, { ...VERSION, version: 2 });

      const version = await getWidgetVersion({ gameId: GAME_ID, version: 2 });

      expect(fetchMock.mock.calls[0][0]).toMatch(new RegExp(`${BASE}/versions/2$`));
      expect(version.config).toEqual({ schemaVersion: 1 });
    });

    it('rolls back with a POST to the version, and returns the new version', async () => {
      const fetchMock = stubFetch(201, { ...VERSION, version: 4 });

      const created = await rollbackWidget({ gameId: GAME_ID, version: 2 });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toMatch(new RegExp(`${BASE}/versions/2/rollback$`));
      expect(init.method).toBe('POST');
      expect(created.version).toBe(4);
    });
  });
});
