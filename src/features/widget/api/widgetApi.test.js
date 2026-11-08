import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildWidgetConfig } from '@/test/builders';

import { getWidgetDraft, saveWidgetDraft } from './widgetApi';

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
});
