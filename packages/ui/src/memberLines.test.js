import { afterEach, describe, expect, it } from 'vitest';

import { createMockData } from './data/mockData.js';
import { isShown, isWritten, memberLineText } from './data/format.js';
import { buildLabels } from './text/labels.js';
import { loadExample, mount } from './testUtils.js';

// Clan member changes (TEAM-293): the host sends "Ali joined the clan" as a message with a kind, the player it is
// about as `from` and no body. The panel draws it as a line in the middle of the clan chat.

const arena = () => loadExample('valid/arena.json');
const at = (minute) => new Date(2026, 10, 15, 21, minute).toISOString();
const say = (id, from, body, minute, mine = false) => ({ id, from, body, mine, at: at(minute) });
const member = (id, kind, from, minute, mine = false) => ({ id, kind, from, body: '', mine, at: at(minute) });

/** Each line of the chat, without day lines: "[sentence]" for a member line, the text of a bubble, or the log line. */
const lines = (root) =>
  [...root().querySelectorAll('.sk-chat > :not(.sk-day-line)')].map((line) =>
    line.classList.contains('sk-member-line') ? `[${line.textContent}]` : (line.querySelector('.sk-bubble')?.textContent ?? line.textContent),
  );

/** The clan chat on Home, with the given messages, in the given layout. */
function clanChat(messages, { layout = 'bubbles', unread = {}, texts } = {}) {
  const config = arena();
  config.chat.layout = layout;
  if (texts) config.texts = { ...config.texts, ...texts };
  return mount(config, { ...createMockData(config), tab: 'clan', screen: 'home', messages, unread });
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('member lines in the clan chat', () => {
  it('draws a join, a leave and a kick as lines in the middle, not as bubbles', () => {
    const { root } = clanChat([
      member('j', 'member_joined', 'Ali', 1),
      say('m', 'Ben', 'welcome Ali', 2),
      member('l', 'member_left', 'Cara', 3),
      member('k', 'member_kicked', 'Dan', 4),
    ]);

    expect(lines(root)).toEqual(['[Ali joined the clan]', 'welcome Ali', '[Cara left the clan]', '[Dan was removed from the clan]']);
    expect(root().querySelectorAll('.sk-chat .sk-msg')).toHaveLength(1);
    expect([...root().querySelectorAll('.sk-member-line')].map((line) => line.getAttribute('data-kind'))).toEqual([
      'member_joined',
      'member_left',
      'member_kicked',
    ]);
  });

  it('draws the same lines in the log layout', () => {
    const { root } = clanChat([say('m', 'Ben', 'hey', 1), member('j', 'member_joined', 'Ali', 2)], { layout: 'log' });

    expect(lines(root)).toEqual([expect.stringContaining('Ben: hey'), '[Ali joined the clan]']);
  });

  it('ends a group of bubbles: the same player\'s next message shows their name again', () => {
    const { root } = clanChat([say('1', 'Ben', 'hey', 1), member('j', 'member_joined', 'Ali', 1), say('2', 'Ben', 'hi Ali', 2)]);
    const bubbles = [...root().querySelectorAll('.sk-chat .sk-msg')];

    expect(bubbles.map((bubble) => bubble.querySelector('.sk-small')?.textContent ?? null)).toEqual(['Ben', 'Ben']);
    // The bubble before the line is the last of its group, so it has its time.
    expect(bubbles[0].querySelector('time')).not.toBeNull();
  });

  it('uses the game\'s word for a clan and its own sentences, with the player\'s name filled in', () => {
    const { root } = clanChat([member('j', 'member_joined', 'Ali $&', 1), member('k', 'member_kicked', 'Dan', 2)], {
      texts: { terms: { clan: 'Guild', clans: 'Guilds' }, labels: { memberJoined: 'Welcome, {player}!' } },
    });

    expect(lines(root)).toEqual(['[Welcome, Ali $&!]', '[Dan was removed from the guild]']);
  });

  it('leaves out a kind the panel does not know, instead of drawing an empty bubble', () => {
    const { root } = clanChat([say('1', 'Ben', 'hey', 1), member('p', 'member_promoted', 'Ali', 2)]);

    expect(lines(root)).toEqual(['hey']);
  });

  it('places the "New messages" line by written messages only, as the host counts', () => {
    // One unread message: Ben's. Cara's join line after it is not counted.
    const { root } = clanChat([say('1', 'Ben', 'old', 1), say('2', 'Ben', 'raid?', 2), member('j', 'member_joined', 'Cara', 3)], { unread: { clan: 1 } });

    expect(lines(root)).toEqual(['old', 'New messages', 'raid?', '[Cara joined the clan]']);
  });

  it('keeps the "New messages" line when the player\'s own join line comes in', () => {
    const config = arena();
    const data = { ...createMockData(config), tab: 'clan', screen: 'home', messages: [say('1', 'Ben', 'old', 1), say('2', 'Ben', 'raid?', 2)], unread: { clan: 1 } };
    const { root, handle } = mount(config, data);
    expect(lines(root)).toEqual(['old', 'New messages', 'raid?']);
    handle.update(config, { ...data, messages: [...data.messages, member('j', 'member_joined', 'You', 3, true)], unread: {} });

    // Only a message the player writes answers what was new; their own join line does not.
    expect(lines(root)).toEqual(['old', 'New messages', 'raid?', '[You joined the clan]']);
  });
});

describe('the chat list preview', () => {
  it('shows the sentence when a conversation\'s last message is a member line', () => {
    const config = arena();
    const threads = { ...createMockData(config).threads, 'f-ben': [say('1', 'Ben', 'gg', 1), member('j', 'member_joined', 'Ben', 2)] };
    const { root } = mount(config, { ...createMockData(config), open: true, tab: 'chat', threads });

    expect(root().querySelector('[data-key="convo-f-ben"] .sk-desc')).toHaveTextContent('Ben joined the clan');
  });
});

describe('message kinds', () => {
  const L = buildLabels({});

  it('treats a message without a kind, or with text, as written', () => {
    expect(isWritten({ body: 'hi' })).toBe(true);
    expect(isWritten({ kind: 'text', body: 'hi' })).toBe(true);
    expect(isWritten({ kind: 'member_joined' })).toBe(false);
  });

  it('shows written messages and the member kinds it knows, and nothing else', () => {
    expect(['text', 'member_joined', 'member_left', 'member_kicked', 'member_promoted', 'toString'].map((kind) => isShown({ kind }))).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it('writes the sentence of a member line, and none for a written message', () => {
    expect(memberLineText({ kind: 'member_left', from: 'Ali' }, L)).toBe('Ali left the clan');
    expect(memberLineText({ kind: 'text', from: 'Ali', body: 'hi' }, L)).toBeNull();
    expect(memberLineText({ kind: 'member_promoted', from: 'Ali' }, L)).toBeNull();
  });

  it('has default sentences that follow the game\'s word for a clan and keep {player} for the name', () => {
    const labels = buildLabels({ texts: { terms: { clan: 'Guild', clans: 'Guilds' } } });

    expect([labels.memberJoined, labels.memberLeft, labels.memberKicked]).toEqual([
      '{player} joined the guild',
      '{player} left the guild',
      '{player} was removed from the guild',
    ]);
  });
});
