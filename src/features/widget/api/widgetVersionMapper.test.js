import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';

import { mapWidgetVersion, mapWidgetVersionList } from './widgetVersionMapper';

const SUMMARY = { version: 2, publishedAt: '2026-11-08T12:00:00Z', publishedBy: '5c0e7d9a-3b6f-4c58-9a21-1d8e4f7b2a60' };

describe('widgetVersionMapper', () => {
  it('maps a version with its config as published, without adding anything to it', () => {
    const config = { schemaVersion: 1 };

    expect(mapWidgetVersion({ ...SUMMARY, config })).toEqual({ ...SUMMARY, config: { schemaVersion: 1 } });
  });

  it.each([[null], [{}], [{ ...SUMMARY }], [{ ...SUMMARY, config: [] }], [{ ...SUMMARY, config: null }], [{ ...SUMMARY, version: '2', config: {} }]])(
    'rejects %j as a version',
    (raw) => {
      expect(() => mapWidgetVersion(raw)).toThrow(ApiError);
    },
  );

  it('maps the list to summaries, newest first even if the server sent another order', () => {
    const list = mapWidgetVersionList({
      versions: [
        { ...SUMMARY, version: 1 },
        { ...SUMMARY, version: 3 },
        { ...SUMMARY, version: 2 },
      ],
    });

    expect(list.map((version) => version.version)).toEqual([3, 2, 1]);
    expect(list[0]).not.toHaveProperty('config');
  });

  it('maps an empty list to an empty array', () => {
    expect(mapWidgetVersionList({ versions: [] })).toEqual([]);
  });

  it.each([[null], [{}], [{ versions: 'x' }], [{ versions: [{ version: 1 }] }]])('rejects %j as a version list', (raw) => {
    expect(() => mapWidgetVersionList(raw)).toThrow(ApiError);
  });
});
