import { afterEach, describe, expect, it } from 'vitest';

import { createMockData } from './data/mockData.js';
import { formatMessageTime } from './data/format.js';
import { loadExample, mount } from './testUtils.js';

const arena = () => loadExample('valid/arena.json');
const at = (minute) => new Date(2026, 10, 15, 21, minute).toISOString();
const say = (id, from, body, minute, mine = false) => ({ id, from, body, mine, at: at(minute) });
// Written as the widget writes it, today or not (the widget compares with the real clock).
const timeOf = (minute) => formatMessageTime(new Date(at(minute)));
const lines = (root) => [...root().querySelector('.sk-chat').children];
const describeLine = (line) => ({
  name: line.querySelector('.sk-small')?.textContent ?? null,
  text: line.querySelector('.sk-bubble')?.textContent,
  time: line.querySelector('time')?.textContent ?? null,
});

// The clan chat on Home, with the given messages, in the given layout.
function clanChat(messages, layout = 'bubbles') {
  const config = arena();
  config.chat.layout = layout;
  config.clan.tags = false;
  return mount(config, { ...createMockData(config), tab: 'clan', screen: 'home', messages, unread: {} });
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('bubbles: grouped by sender', () => {
  it('shows the name once above a run of one player\'s messages, and the time once under it', () => {
    const { root } = clanChat([
      say('1', 'Ben', 'hey', 4),
      say('2', 'Ben', 'you up?', 4),
      say('3', 'Ben', 'raid at 9', 5),
      say('4', 'You', 'yeah, 2m', 6, true),
      say('5', 'Cara', 'on my way', 7),
    ]);

    expect(lines(root).map(describeLine)).toEqual([
      { name: 'Ben', text: 'hey', time: null },
      { name: null, text: 'you up?', time: null },
      { name: null, text: 'raid at 9', time: timeOf(5) },
      { name: 'You', text: 'yeah, 2m', time: timeOf(6) },
      { name: 'Cara', text: 'on my way', time: timeOf(7) },
    ]);
    expect(lines(root).map((line) => line.getAttribute('data-group-start'))).toEqual(['true', 'false', 'false', 'true', 'true']);
  });

  it('starts a new group when the same player writes again after more than five minutes', () => {
    const { root } = clanChat([say('1', 'Ben', 'hey', 0), say('2', 'Ben', 'anyone?', 10)]);

    expect(lines(root).map(describeLine)).toEqual([
      { name: 'Ben', text: 'hey', time: timeOf(0) },
      { name: 'Ben', text: 'anyone?', time: timeOf(10) },
    ]);
  });

  it('gives the time a machine-readable datetime', () => {
    const { root } = clanChat([say('1', 'Ben', 'hey', 4)]);

    expect(root().querySelector('time')).toHaveAttribute('datetime', at(4));
  });

  it('groups messages without a time by sender alone, and shows no time for them', () => {
    const { root } = clanChat([
      { id: '1', from: 'Ben', body: 'hey', mine: false },
      { id: '2', from: 'Ben', body: 'there', mine: false },
    ]);

    expect(lines(root).map(describeLine)).toEqual([
      { name: 'Ben', text: 'hey', time: null },
      { name: null, text: 'there', time: null },
    ]);
  });

  it('starts a new group after the "New messages" line, so the name shows again', () => {
    const config = arena();
    config.clan.tags = false;
    const messages = [say('1', 'Ben', 'hey', 4), say('2', 'Ben', 'you up?', 4)];
    const { root } = mount(config, { ...createMockData(config), tab: 'clan', screen: 'home', messages, unread: { clan: 1 } });

    expect(lines(root).map((line) => line.querySelector('.sk-small')?.textContent ?? line.textContent.replace(/\d.*$/, '').trim())).toEqual(['Ben', 'New messages', 'Ben']);
  });
});

describe('log: a time and a name on every line', () => {
  it('writes the time, then the name, on each line, even for a run from one player', () => {
    const { root } = clanChat([say('1', 'Ben', 'hey', 4), say('2', 'Ben', 'you up?', 4)], 'log');

    expect(lines(root).map((line) => line.textContent)).toEqual([`${timeOf(4)} Ben: hey`, `${timeOf(4)} Ben: you up?`]);
  });

  it('leaves the time out of a line whose message has none', () => {
    const { root } = clanChat([{ id: '1', from: 'Ben', body: 'hey', mine: false }], 'log');

    expect(lines(root)[0].textContent).toBe('Ben: hey');
  });
});

describe('formatMessageTime', () => {
  it('writes just the time for today, and the day too for an earlier one', () => {
    const now = new Date(2026, 10, 15, 22, 0);

    expect(formatMessageTime(new Date(2026, 10, 15, 21, 4), now)).not.toMatch(/Nov/);
    expect(formatMessageTime(new Date(2026, 10, 14, 21, 4), now)).toMatch(/Nov 14/);
  });

  it('uses the 24-hour clock, with two-digit hours', () => {
    const now = new Date(2026, 10, 15, 23, 0);

    expect(formatMessageTime(new Date(2026, 10, 15, 21, 4), now)).toBe('21:04');
    expect(formatMessageTime(new Date(2026, 10, 15, 9, 30), now)).toBe('09:30');
    expect(formatMessageTime(new Date(2026, 10, 15, 0, 5), now)).toBe('00:05');
  });
});
