import { describe, expect, it } from 'vitest';

import { buildWidgetConfig } from '@/test/builders';

import { describeConfig, formatKilobytes } from './measureConfig';

describe('describeConfig', () => {
  it('wraps the config in a config envelope, as the platform API does', () => {
    const config = buildWidgetConfig();

    const parsed = JSON.parse(describeConfig(config).json);

    expect(Object.keys(parsed)).toEqual(['config']);
    expect(parsed.config).toEqual(config);
  });

  it('pretty-prints with two spaces', () => {
    const { json } = describeConfig({ schemaVersion: 1 });

    expect(json).toBe('{\n  "config": {\n    "schemaVersion": 1\n  }\n}');
  });

  it('counts the size of the config only, as the platform does: compact JSON, no envelope', () => {
    const config = { schemaVersion: 1, text: 'é' };

    const { json, bytes } = describeConfig(config);

    expect(bytes).toBe(new TextEncoder().encode('{"schemaVersion":1,"text":"é"}').length);
    expect(new TextEncoder().encode(json).length).toBeGreaterThan(bytes);
  });

  it('counts bytes, not characters, and does not count indentation', () => {
    expect(describeConfig({ a: 'ééé' }).bytes).toBe(new TextEncoder().encode('{"a":"ééé"}').length);
    expect(describeConfig({ a: { b: { c: 1 } } }).bytes).toBe('{"a":{"b":{"c":1}}}'.length);
  });

  it('is well under the limit for the arena example, so a normal config never warns', () => {
    expect(describeConfig(buildWidgetConfig()).bytes).toBeLessThan(2 * 1024);
  });
});

describe('formatKilobytes', () => {
  it('writes bytes as KB with one decimal', () => {
    expect(formatKilobytes(1024)).toBe('1.0 KB');
    expect(formatKilobytes(65536)).toBe('64.0 KB');
  });
});
