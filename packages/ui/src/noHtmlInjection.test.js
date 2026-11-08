import { fireEvent } from '@testing-library/react';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockData } from './data/mockData.js';
import { SCREENS } from './data/screens.js';
import { loadExample, mount } from './testUtils.js';

const PAYLOADS = ['<img src=x onerror="window.__pwned = 1">', '<script>window.__pwned = 1</script>', '"><svg onload=alert(1)>'];

const SOURCE_DIR = dirname(fileURLToPath(import.meta.url));
const FORBIDDEN_APIS = /innerHTML|outerHTML|insertAdjacentHTML|createContextualFragment|document\.write|DOMParser|setHTMLUnsafe|parseHTMLUnsafe|\beval\(|new Function|insertRule|adoptedStyleSheets/;

const sourceFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.js') && !entry.name.includes('.test.') && entry.name !== 'testUtils.js' ? [path] : [];
  });

describe('no config value reaches innerHTML', () => {
  const restores = [];
  let htmlSinks;

  /** Replace a property setter or method with a spy that still calls the original. */
  const spyOnSetter = (target, name) => {
    const descriptor = Object.getOwnPropertyDescriptor(target, name);
    if (!descriptor?.set) return;
    const spy = vi.fn(descriptor.set);
    Object.defineProperty(target, name, { ...descriptor, set: spy });
    restores.push(() => Object.defineProperty(target, name, descriptor));
    htmlSinks.push(spy);
  };
  const spyOnMethod = (target, name) => {
    if (typeof target?.[name] !== 'function') return;
    const original = target[name];
    const spy = vi.fn(original);
    target[name] = spy;
    restores.push(() => {
      target[name] = original;
    });
    htmlSinks.push(spy);
  };

  beforeEach(() => {
    htmlSinks = [];
    [Element.prototype, ShadowRoot.prototype].forEach((target) => {
      spyOnSetter(target, 'innerHTML');
      spyOnSetter(target, 'outerHTML');
      spyOnMethod(target, 'insertAdjacentHTML');
      spyOnMethod(target, 'setHTMLUnsafe');
    });
    spyOnMethod(document, 'write');
    spyOnMethod(DOMParser.prototype, 'parseFromString');
    spyOnMethod(Range.prototype, 'createContextualFragment');
    delete window.__pwned;
  });

  afterEach(() => {
    restores.splice(0).forEach((restore) => restore());
    document.body.replaceChildren();
  });

  /** Every string a config can carry, set to a hostile value. */
  const hostileConfig = (payload) => {
    const config = loadExample('valid/arena.json');
    const labelKeys = [
      'panelTitle', 'launcher', 'tabFriends', 'tabClan', 'tabChat', 'accept', 'chatBtn', 'join', 'full', 'createCta', 'createBtn', 'cancel',
      'info', 'viewMembers', 'leave', 'send', 'createTitle', 'membersTitle', 'searchPlayers', 'searchClans', 'messagePh', 'clanChatOff',
    ];
    config.texts.labels = Object.fromEntries(labelKeys.map((key) => [key, `${key}: ${payload}`]));
    config.texts.terms = { clan: payload, clans: payload };
    config.game_id = payload;
    config.theme.colors = { brand: payload, background: payload, surface: payload, text: payload, muted: payload };
    config.theme.frame.color = payload;
    config.theme.components = Object.fromEntries(
      ['bubbleMine', 'bubbleTheirs', 'button', 'buttonSecondary', 'tab', 'tabSelected', 'row'].map((part) => [
        part,
        { background: payload, text: payload, borderStyle: payload, borderWidth: payload, borderColor: payload, radius: payload },
      ]),
    );
    config.theme.fonts.heading.family = payload;
    config.theme.fonts.body.family = payload;
    config.theme.textures = { panel: { asset: 'custom-metal' }, content: { asset: payload }, button: { asset: payload }, bubble: { asset: payload } };
    config.clan.badges.allowed = [payload, 'star', 'custom-dragon'];
    config.clan.roles = [
      { id: 'member', name: payload, canPromote: false, canKick: false },
      { id: payload, name: payload, canPromote: true, canKick: true },
      { id: 'leader', name: payload, canPromote: true, canKick: true },
    ];
    return config;
  };

  /** Every string the host can pass as data, set to a hostile value. */
  const hostileData = (config, payload, inClan) => {
    const data = createMockData(config, { inClan });
    return {
      assets: { badges: { 'custom-dragon': payload }, textures: { 'custom-metal': payload } },
      player: { id: 'm-0', name: payload },
      clan: inClan ? { ...data.clan, name: payload, tag: payload, description: payload, ownerName: payload, badge: payload, createdAt: payload } : null,
      clans: data.clans.map((clan) => ({ ...clan, name: payload, tag: payload, description: payload, badge: payload })),
      members: data.members.map((member, index) => ({ ...member, name: payload, role: index === 0 ? 'leader' : index === 1 ? payload : 'member' })),
      messages: data.messages.map((message) => ({ ...message, from: payload, body: payload })),
      friends: data.friends.map((friend) => ({ ...friend, name: payload, status: payload })),
      requests: data.requests.map((request) => ({ ...request, name: payload })),
      threads: Object.fromEntries(
        Object.entries(data.threads).map(([id, thread]) => [id, thread.map((message) => ({ ...message, from: payload, body: payload }))]),
      ),
    };
  };

  const VIEWS = [...SCREENS, 'friends', 'chat'];

  const tour = (payload, viewName) => {
    const config = hostileConfig(payload);
    const inClan = viewName !== 'discover' && viewName !== 'create';
    const isTab = viewName === 'friends' || viewName === 'chat';
    const view = mount(config, { ...hostileData(config, payload, inClan), ...(isTab ? { tab: viewName } : { screen: viewName }), open: true });
    if (viewName === 'home') fireEvent.click(view.ui().getByRole('button', { name: /clan info/i }));
    if (viewName === 'members') {
      fireEvent.click(view.root().querySelector('.sk-row-button'));
      fireEvent.click(view.ui().getByRole('button', { name: 'Kick' }));
    }
    return view;
  };

  it.each(PAYLOADS.flatMap((payload) => VIEWS.map((view) => [view, payload])))('draws the %s view with %s as text', (screen, payload) => {
    const { root } = tour(payload, screen);

    expect(htmlSinks.every((sink) => sink.mock.calls.length === 0)).toBe(true);
    expect(root().querySelector('img, script, svg[onload], iframe, object, embed, link, style')).toBeNull();
    expect(root().style.getPropertyValue('--sk-tex-panel')).toBe('none');
    expect([...root().querySelectorAll('*')].flatMap((element) => element.getAttributeNames()).filter((name) => name.startsWith('on'))).toEqual([]);
    expect(window.__pwned).toBeUndefined();
  });

  it('shows hostile text literally instead of parsing it', () => {
    const payload = PAYLOADS[0];
    const { root } = tour(payload, 'discover');

    expect(root().textContent).toContain(payload);
    expect(root().querySelectorAll('img')).toHaveLength(0);
  });

  it('falls back to safe theme values when colors, fonts and textures are hostile', () => {
    const { root } = tour(PAYLOADS[1], 'home');
    const style = root().style.cssText;

    expect(style).not.toContain('<');
    expect(style).toContain('--sk-brand: #80EAFF');
    expect(style).toContain("--sk-font-body: 'Inter', sans-serif");
  });

  it('survives updates with hostile values too', () => {
    const payload = PAYLOADS[2];
    const { handle, root } = mount(loadExample('valid/arena.json'));

    handle.update(hostileConfig(payload), { ...hostileData(hostileConfig(payload), payload, true), open: true });

    expect(htmlSinks.every((sink) => sink.mock.calls.length === 0)).toBe(true);
    expect(root().querySelector('svg[onload]')).toBeNull();
  });

  it('does not use any HTML-parsing API in its source', () => {
    const offenders = sourceFiles(SOURCE_DIR).filter((file) => FORBIDDEN_APIS.test(readFileSync(file, 'utf8')));

    expect(offenders).toEqual([]);
  });

  it('would notice an innerHTML write (the spies are live)', () => {
    document.createElement('div').innerHTML = '<b>x</b>';
    document.createElement('div').attachShadow({ mode: 'open' }).innerHTML = '<b>x</b>';
    document.createElement('div').insertAdjacentHTML('beforeend', '<b>x</b>');

    expect(htmlSinks.filter((sink) => sink.mock.calls.length > 0).length).toBeGreaterThanOrEqual(2);
  });
});
