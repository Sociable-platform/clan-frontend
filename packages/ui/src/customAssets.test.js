import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { assetName, isCustomAssetId, safeAssetUrl } from './data/assets.js';
import { createMockData } from './data/mockData.js';
import { loadExample, mount } from './testUtils.js';
import { resolveTheme } from './theme/theme.js';

afterEach(() => {
  document.body.replaceChildren();
});

const PIXEL = 'data:image/png;base64,iVBORw0KGgo=';
const custom = () => loadExample('valid/custom-assets.json');
const noClan = (config, extra = {}) => ({ ...createMockData(config, { inClan: false }), screen: 'create', open: true, ...extra });

describe('safeAssetUrl', () => {
  it.each([
    ['https://cdn.example/dragon.png', true],
    ['http://localhost:3000/img/dragon.png', true],
    ['/img/dragon.png', true],
    ['./img/dragon.png', true],
    ['../img/dragon.png', true],
    ['img/dragon.png', true],
    [PIXEL, true],
    ['data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', true],
    ['javascript:alert(1)', false],
    ['data:text/html;base64,PHNjcmlwdD4=', false],
    ['data:image/png;base64,AAAA" onerror="x', false],
    ['//evil.example/x.png', false],
    ['https://x.example/a.png") , url("https://evil', false],
    ['https://x.example/a b.png', false],
    ["https://x.example/a'.png", false],
    ['file:///etc/passwd', false],
    ['', false],
    [null, false],
    [42, false],
  ])('%s -> usable: %s', (url, usable) => {
    expect(safeAssetUrl(url) !== null).toBe(usable);
  });
});

describe('custom asset names', () => {
  it('knows a custom name when it follows the schema pattern', () => {
    expect(isCustomAssetId('custom-dragon')).toBe(true);
    expect(isCustomAssetId('custom-ember-flame')).toBe(true);
    expect(['Custom-dragon', 'custom_dragon', 'custom-', 'star', 'custom-' + 'a'.repeat(26), undefined].some(isCustomAssetId)).toBe(false);
  });

  it('writes a name for people', () => {
    expect(assetName('custom-ember-flame')).toBe('Ember flame');
  });
});

describe('custom badges', () => {
  it('draws the game image for a custom badge it maps, and a neutral initial for one it does not', () => {
    const config = custom();
    const assets = { badges: { 'custom-dragon': PIXEL } };
    const { ui, root } = mount(config, noClan(config, { assets }));

    expect(ui().getAllByRole('radio')).toHaveLength(4);
    expect(root().querySelectorAll('.sk-badge-pick img')).toHaveLength(1);
    expect(root().querySelector('.sk-badge-pick img')).toHaveAttribute('src', PIXEL);
    expect(ui().getByRole('radio', { name: 'Ember flame' })).toHaveTextContent('E');
  });

  it('never uses an unsafe URL from the host', () => {
    const config = custom();
    const { root } = mount(config, noClan(config, { assets: { badges: { 'custom-dragon': 'javascript:alert(1)', 'custom-ember-flame': '//evil.example/x.png' } } }));

    expect(root().querySelectorAll('img')).toHaveLength(0);
  });

  it('shows a clan with a custom badge on the discover list', () => {
    const config = custom();
    const data = createMockData(config, { inClan: false });
    data.clans[0].badge = 'custom-dragon';
    const { root } = mount(config, { ...data, screen: 'discover', open: true, assets: { badges: { 'custom-dragon': PIXEL } } });

    expect(root().querySelectorAll('.sk-row img')).toHaveLength(1);
  });

  it('falls back to another allowed badge for a custom name the game no longer allows', () => {
    const config = custom();
    const data = createMockData(config, { inClan: false });
    data.clans[0].badge = 'custom-gone';
    const { root } = mount(config, { ...data, screen: 'discover', open: true });

    expect(root().querySelectorAll('.sk-row .sk-badge')[0]).toHaveTextContent('★');
  });
});

describe('custom textures', () => {
  it('tiles the game image under a translucent layer of the slot color', () => {
    const config = custom();
    const { vars } = resolveTheme(config, { textures: { 'custom-metal': 'https://cdn.example/metal.png' } });

    expect(vars['--sk-tex-panel']).toBe('linear-gradient(rgba(20, 29, 31, 0.82), rgba(20, 29, 31, 0.82)), url("https://cdn.example/metal.png")');
    expect(vars['--sk-tex-content']).toBe('none');
    expect(vars['--sk-btn-image']).toContain('repeating-linear-gradient');
  });

  it('is no texture when the game maps nothing or something unsafe', () => {
    const config = custom();

    expect(resolveTheme(config).vars['--sk-tex-panel']).toBe('none');
    expect(resolveTheme(config, { textures: { 'custom-metal': 'javascript:alert(1)' } }).vars['--sk-tex-panel']).toBe('none');
    expect(resolveTheme(config, { textures: { 'custom-other': 'https://cdn.example/x.png' } }).vars['--sk-tex-panel']).toBe('none');
  });

  it('covers a button with its own color', () => {
    const config = custom();
    config.theme.textures.button = { asset: 'custom-grain', fit: 'tile', strength: 'subtle' };

    const { vars } = resolveTheme(config, { textures: { 'custom-grain': '/img/grain.png' } });

    expect(vars['--sk-btn-image']).toBe('linear-gradient(rgba(128, 234, 255, 0.82), rgba(128, 234, 255, 0.82)), url("/img/grain.png")');
  });

  it('reaches the panel when mounted', () => {
    const config = custom();
    const { root } = mount(config, { ...createMockData(config), open: true, assets: { textures: { 'custom-metal': '/img/metal.png' } } });

    expect(root().style.getPropertyValue('--sk-tex-panel')).toContain('url("/img/metal.png")');
  });
});

describe('badge choice in the create screen', () => {
  const pick = (ui, name) => ui().getByRole('radio', { name });
  const checkedNames = (ui) => ui().getAllByRole('radio').filter((radio) => radio.getAttribute('aria-checked') === 'true').map((radio) => radio.getAttribute('aria-label'));

  it('is a radio group with exactly one badge selected at a time', () => {
    const config = custom();
    const { ui } = mount(config, noClan(config));

    expect(ui().getByRole('radiogroup', { name: 'Badge' })).toBeInTheDocument();
    expect(checkedNames(ui)).toEqual(['Star badge']);

    fireEvent.click(pick(ui, 'Moon badge'));

    expect(checkedNames(ui)).toEqual(['Moon badge']);

    fireEvent.click(pick(ui, 'Dragon'));

    expect(checkedNames(ui)).toEqual(['Dragon']);
  });

  it('only the selected badge is reachable with Tab', () => {
    const config = custom();
    const { ui } = mount(config, noClan(config));

    fireEvent.click(pick(ui, 'Moon badge'));

    const tabStops = ui().getAllByRole('radio').filter((radio) => radio.getAttribute('tabindex') === '0');

    expect(tabStops.map((radio) => radio.getAttribute('aria-label'))).toEqual(['Moon badge']);
  });

  it('moves the focus with the choice: the new badge has it and the old one lets go', () => {
    const config = custom();
    const { ui, shadow } = mount(config, noClan(config));
    pick(ui, 'Star badge').focus();

    fireEvent.keyDown(pick(ui, 'Star badge'), { key: 'ArrowRight' });

    expect(checkedNames(ui)).toEqual(['Moon badge']);
    expect(shadow.activeElement).toBe(pick(ui, 'Moon badge'));
    expect(shadow.activeElement).not.toBe(pick(ui, 'Star badge'));
  });

  it('wraps around with the arrow keys', () => {
    const config = custom();
    const { ui } = mount(config, noClan(config));

    fireEvent.keyDown(pick(ui, 'Star badge'), { key: 'ArrowLeft' });

    expect(checkedNames(ui)).toEqual(['Ember flame']);

    fireEvent.keyDown(pick(ui, 'Ember flame'), { key: 'ArrowDown' });

    expect(checkedNames(ui)).toEqual(['Star badge']);
  });

  it('keeps the focus on the badge that was clicked', () => {
    const config = custom();
    const { ui, shadow } = mount(config, noClan(config));

    pick(ui, 'Moon badge').focus();
    fireEvent.click(pick(ui, 'Moon badge'));

    expect(shadow.activeElement).toBe(pick(ui, 'Moon badge'));
  });
});
