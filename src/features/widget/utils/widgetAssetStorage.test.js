import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadWidgetAssets, saveWidgetAssets } from './widgetAssetStorage';

const PIXEL = 'data:image/png;base64,iVBORw0KGgo=';

beforeEach(() => {
  window.localStorage.clear();
});

describe('widget asset storage', () => {
  it('keeps the images per game', () => {
    saveWidgetAssets('g1', { badge: { 'custom-dragon': PIXEL }, texture: {} });
    saveWidgetAssets('g2', { badge: {}, texture: { 'custom-metal': PIXEL } });

    expect(loadWidgetAssets('g1')).toEqual({ badge: { 'custom-dragon': PIXEL }, texture: {} });
    expect(loadWidgetAssets('g2')).toEqual({ badge: {}, texture: { 'custom-metal': PIXEL } });
    expect(loadWidgetAssets('g3')).toEqual({ badge: {}, texture: {} });
  });

  it('drops anything that is not a custom name with an inline PNG, WebP or SVG', () => {
    window.localStorage.setItem(
      'clan.studio.assets.g1',
      JSON.stringify({
        badge: { 'custom-ok': PIXEL, Star: PIXEL, 'custom-bad': 'https://evil.example/x.png', 'custom-js': 'javascript:alert(1)', 'custom-html': 'data:text/html;base64,AAAA' },
        texture: { 'custom-quote': 'data:image/png;base64,AAAA"onerror="x' },
      }),
    );

    expect(loadWidgetAssets('g1')).toEqual({ badge: { 'custom-ok': PIXEL }, texture: {} });
  });

  it('starts empty when the stored value is not usable', () => {
    window.localStorage.setItem('clan.studio.assets.g1', '{not json');

    expect(loadWidgetAssets('g1')).toEqual({ badge: {}, texture: {} });
  });

  it('says so when the browser refuses to keep the images', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(saveWidgetAssets('g1', { badge: {}, texture: {} })).toBe(false);
  });
});
