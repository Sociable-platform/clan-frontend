import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';
import { buildWidgetConfig } from '@/test/builders';

import { mapWidgetDraft } from './widgetMapper';

describe('widgetMapper', () => {
  it('returns the config document unchanged', () => {
    const config = buildWidgetConfig();

    expect(mapWidgetDraft(config)).toBe(config);
  });

  it.each([[null], [[]], ['text'], [{}], [{ config: {} }]])('rejects %j as a draft', (raw) => {
    expect(() => mapWidgetDraft(raw)).toThrow(ApiError);
  });
});
