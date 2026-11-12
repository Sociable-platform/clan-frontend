import { describe, expect, it } from 'vitest';

import { ASSET_KINDS } from '../config/widgetAssets';
import { assetIdFromFileName, assetLabel, buildAssetsSnippet, checkImageBytes, isCustomAssetId, sniffImageFormat, toDataUrl } from './customAssets';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const WEBP = [0x52, 0x49, 0x46, 0x46, 1, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
const text = (value) => new TextEncoder().encode(value);
const bytes = (list, size = list.length) => Uint8Array.from({ length: size }, (_, index) => list[index] ?? 0);

describe('assetIdFromFileName', () => {
  it.each([
    ['Dragon Badge.png', 'custom-dragon-badge'],
    ['ember_flame.WEBP', 'custom-ember-flame'],
    ['  --Metal  Plate!!.png', 'custom-metal-plate'],
    ['Ünïcode Pêl.png', 'custom-unicode-pel'],
    ['dragon.v2.final.png', 'custom-dragon-v2-final'],
    ['日本語.png', 'custom-image'],
    ['.png', 'custom-image'],
  ])('names %s as %s', (fileName, expected) => {
    expect(assetIdFromFileName(fileName)).toBe(expected);
  });

  it('always matches the contract: pattern and 32 characters at most', () => {
    const id = assetIdFromFileName(`${'long-name-'.repeat(10)}.png`);

    expect(id.length).toBeLessThanOrEqual(32);
    expect(isCustomAssetId(id)).toBe(true);
  });

  it('numbers a name that is already taken, still within 32 characters', () => {
    expect(assetIdFromFileName('Dragon.png', ['custom-dragon'])).toBe('custom-dragon-2');
    expect(assetIdFromFileName('Dragon.png', ['custom-dragon', 'custom-dragon-2'])).toBe('custom-dragon-3');

    const long = assetIdFromFileName(`${'a'.repeat(40)}.png`);
    const next = assetIdFromFileName(`${'a'.repeat(40)}.png`, [long]);

    expect(next).not.toBe(long);
    expect(next.length).toBeLessThanOrEqual(32);
    expect(isCustomAssetId(next)).toBe(true);
  });
});

describe('isCustomAssetId and assetLabel', () => {
  it('accepts only the schema pattern', () => {
    expect(isCustomAssetId('custom-dragon')).toBe(true);
    expect(['star', 'custom-', 'Custom-a', 'custom_a', 'custom-a-', undefined, 5].some(isCustomAssetId)).toBe(false);
  });

  it('writes a name for people', () => {
    expect(assetLabel('custom-ember-flame')).toBe('Ember flame');
  });
});

describe('sniffImageFormat', () => {
  it('recognises PNG, WebP and SVG by their content', () => {
    expect(sniffImageFormat(bytes(PNG))?.id).toBe('png');
    expect(sniffImageFormat(bytes(WEBP))?.id).toBe('webp');
    expect(sniffImageFormat(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))?.id).toBe('svg');
    expect(sniffImageFormat(text('﻿  <?xml version="1.0"?><svg></svg>'))?.id).toBe('svg');
  });

  it('does not trust anything else', () => {
    expect(sniffImageFormat(text('<html><svg></svg></html>'))).toBeNull();
    expect(sniffImageFormat(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBeNull();
    expect(sniffImageFormat(text('hello'))).toBeNull();
  });
});

describe('checkImageBytes', () => {
  it('accepts a PNG badge and texture, an SVG badge but not an SVG texture', () => {
    expect(checkImageBytes(bytes(PNG), ASSET_KINDS.BADGE)).toBeNull();
    expect(checkImageBytes(bytes(PNG), ASSET_KINDS.TEXTURE)).toBeNull();
    expect(checkImageBytes(text('<svg></svg>'), ASSET_KINDS.BADGE)).toBeNull();
    expect(checkImageBytes(text('<svg></svg>'), ASSET_KINDS.TEXTURE)).toMatch(/^Use PNG or WebP\./);
  });

  it('refuses a file that is empty, too big or not an image', () => {
    expect(checkImageBytes(new Uint8Array(0), ASSET_KINDS.BADGE)).toBe('The file is empty.');
    expect(checkImageBytes(bytes(PNG, 64 * 1024 + 1), ASSET_KINDS.BADGE)).toMatch(/too big.*64 KB/);
    expect(checkImageBytes(bytes(PNG, 64 * 1024 + 1), ASSET_KINDS.TEXTURE)).toBeNull();
    expect(checkImageBytes(bytes(PNG, 256 * 1024 + 1), ASSET_KINDS.TEXTURE)).toMatch(/too big.*256 KB/);
    expect(checkImageBytes(text('MZ not an image'), ASSET_KINDS.BADGE)).toMatch(/^Use PNG, WebP or SVG/);
  });

  it.each([
    ['a script element', '<svg><script>alert(1)</script></svg>'],
    ['an event handler', '<svg onload="alert(1)"></svg>'],
    ['a foreignObject', '<svg><foreignObject><div/></foreignObject></svg>'],
    ['a javascript link', '<svg><a href="javascript:alert(1)"/></svg>'],
  ])('refuses an SVG with %s', (_name, svg) => {
    expect(checkImageBytes(text(svg), ASSET_KINDS.BADGE)).toMatch(/script or an embedded page/);
  });
});

describe('toDataUrl', () => {
  it('encodes the bytes with the format MIME type, also for big files', () => {
    expect(toDataUrl(Uint8Array.from([1, 2, 3]), { mime: 'image/png' })).toBe('data:image/png;base64,AQID');
    expect(toDataUrl(new Uint8Array(100_000), { mime: 'image/webp' })).toMatch(/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/);
  });
});

describe('buildAssetsSnippet', () => {
  it('lists the names the config uses with a placeholder path each', () => {
    const snippet = buildAssetsSnippet({ badgeIds: ['custom-dragon'], textureIds: ['custom-metal'] });

    expect(snippet).toContain("SocialKit.init({");
    expect(snippet).toContain("'custom-dragon': '/path/to/badges/dragon.png',");
    expect(snippet).toContain("'custom-metal': '/path/to/textures/metal.png',");
  });

  it('leaves out a kind with no names, and is empty when there are none', () => {
    expect(buildAssetsSnippet({ badgeIds: ['custom-a'] })).not.toContain('textures');
    expect(buildAssetsSnippet({})).toBe('');
  });
});
