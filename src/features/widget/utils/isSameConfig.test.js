import { describe, expect, it } from 'vitest';

import { buildWidgetConfig } from '@/test/builders';

import { isSameConfig } from './isSameConfig';

describe('isSameConfig', () => {
  it('is true for equal documents, whatever the order of the keys', () => {
    expect(isSameConfig({ a: 1, b: { c: [1, 2], d: 'x' } }, { b: { d: 'x', c: [1, 2] }, a: 1 })).toBe(true);
  });

  it('is true for a copy of a full config and false after a change anywhere in it', () => {
    const config = buildWidgetConfig();
    const changed = buildWidgetConfig((c) => {
      c.theme.colors.brand = '#000000';
    });

    expect(isSameConfig(config, buildWidgetConfig())).toBe(true);
    expect(isSameConfig(config, changed)).toBe(false);
  });

  it('tells apart different values, types, extra keys, missing keys and array order', () => {
    expect(isSameConfig({ a: 1 }, { a: 2 })).toBe(false);
    expect(isSameConfig({ a: 1 }, { a: '1' })).toBe(false);
    expect(isSameConfig({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isSameConfig({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(isSameConfig({ a: undefined }, { b: undefined })).toBe(false);
    expect(isSameConfig([1, 2], [2, 1])).toBe(false);
    expect(isSameConfig([1], [1, 2])).toBe(false);
    expect(isSameConfig({ a: [] }, { a: {} })).toBe(false);
    expect(isSameConfig(null, {})).toBe(false);
  });
});
