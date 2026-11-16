import { afterEach, describe, expect, it } from 'vitest';

import { createMockData } from './data/mockData.js';
import { formatMessageDay, formatMessageTime } from './data/format.js';
import { loadExample, mount } from './testUtils.js';

const arena = () => loadExample('valid/arena.json');
const at = (minute) => new Date(2026, 10, 15, 21, minute).toISOString();
const say = (id, from, body, minute, mine = false) => ({ id, from, body, mine, at: at(minute) });
const timeOf = (minute) => formatMessageTime(new Date(at(minute)));
// Message and "New messages" lines, without the day lines (those have their own tests below).
const lines = (root) => [...root().querySelectorAll('.sk-chat > :not(.sk-day-line)')];
const allLines = (root) => [...root().querySelector('.sk-chat').children].map((line) => (line.classList.contains('sk-day-line') ? `[${line.textContent}]` : line.querySelector('.sk-bubble')?.textContent ?? line.textContent));
const on = (day, hour, minute = 0) => new Date(2026, 10, day, hour, minute).toISOString();
const describeLine = (line) => ({
  name: line.querySelector('.sk-small')?.textContent ?? null,
  text: line.querySelector('.sk-bubble')?.textContent,
  time: line.querySelector('time')?.textContent ?? null,
});

// The clan chat on Home, with the given messages, in the given layout.
function clanChat(messages, layout = 'bubbles') {
  const config = arena();
  config.chat.layout = layout;
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

describe('day lines', () => {
  it('puts a day line above the first message of each day, and only there', () => {
    const { root } = clanChat([
      { id: '1', from: 'Ben', body: 'gg', mine: false, at: on(13, 20) },
      { id: '2', from: 'Cara', body: 'rematch?', mine: false, at: on(13, 21) },
      { id: '3', from: 'Ben', body: 'morning', mine: false, at: on(15, 9) },
      { id: '4', from: 'Ben', body: 'raid tonight', mine: false, at: on(15, 10) },
    ]);
    const day = (date) => `[${formatMessageDay(new Date(date))}]`;

    expect(allLines(root)).toEqual([day(on(13, 20)), 'gg', 'rematch?', day(on(15, 9)), 'morning', 'raid tonight']);
    expect(root().querySelector('.sk-day-line')).toHaveAttribute('role', 'separator');
  });

  it('starts a new group across midnight, so the name shows again under the day line', () => {
    const { root } = clanChat([
      { id: '1', from: 'Ben', body: 'late', mine: false, at: on(14, 23, 58) },
      { id: '2', from: 'Ben', body: 'still up', mine: false, at: on(15, 0, 1) },
    ]);

    expect(lines(root).map((line) => line.querySelector('.sk-small')?.textContent ?? null)).toEqual(['Ben', 'Ben']);
  });

  it('puts the day line above the "New messages" line when both start at the same message', () => {
    const config = arena();
    const messages = [
      { id: '1', from: 'Ben', body: 'gg', mine: false, at: on(13, 20) },
      { id: '2', from: 'Ben', body: 'morning', mine: false, at: on(15, 9) },
    ];
    const { root } = mount(config, { ...createMockData(config), tab: 'clan', screen: 'home', messages, unread: { clan: 1 } });

    expect(allLines(root).slice(2)).toEqual([`[${formatMessageDay(new Date(on(15, 9)))}]`, 'New messages', 'morning']);
  });

  it('draws day lines in the log layout too', () => {
    const { root } = clanChat(
      [
        { id: '1', from: 'Ben', body: 'gg', mine: false, at: on(13, 20) },
        { id: '2', from: 'Ben', body: 'morning', mine: false, at: on(15, 9) },
      ],
      'log',
    );

    expect(root().querySelectorAll('.sk-day-line')).toHaveLength(2);
  });

  it('draws no day line for messages without a time', () => {
    const { root } = clanChat([{ id: '1', from: 'Ben', body: 'hey', mine: false }]);

    expect(root().querySelector('.sk-day-line')).toBeNull();
  });
});

describe('formatMessageDay', () => {
  const now = new Date(2026, 10, 15, 0, 30);

  it('says Today and Yesterday by the calendar day, not the last 24 hours', () => {
    expect(formatMessageDay(new Date(2026, 10, 15, 0, 5), now)).toBe('Today');
    expect(formatMessageDay(new Date(2026, 10, 14, 23, 59), now)).toBe('Yesterday');
    expect(formatMessageDay(new Date(2026, 10, 14, 0, 1), now)).toBe('Yesterday');
  });

  it('writes the date for an earlier day, with the year only when it is not this year', () => {
    expect(formatMessageDay(new Date(2026, 10, 13, 12, 0), now)).toMatch(/Nov 13/);
    expect(formatMessageDay(new Date(2026, 10, 13, 12, 0), now)).not.toMatch(/2026/);
    expect(formatMessageDay(new Date(2025, 10, 13, 12, 0), now)).toMatch(/2025/);
  });

  it('knows yesterday across a month and a year boundary', () => {
    expect(formatMessageDay(new Date(2025, 11, 31, 22, 0), new Date(2026, 0, 1, 1, 0))).toBe('Yesterday');
  });
});

describe('formatMessageTime', () => {
  it('writes only the time, even for an earlier day (the day line carries the date)', () => {
    expect(formatMessageTime(new Date(2026, 10, 14, 21, 4))).toBe('21:04');
  });

  it('uses the 24-hour clock, with two-digit hours', () => {
    expect(formatMessageTime(new Date(2026, 10, 15, 21, 4))).toBe('21:04');
    expect(formatMessageTime(new Date(2026, 10, 15, 9, 30))).toBe('09:30');
    expect(formatMessageTime(new Date(2026, 10, 15, 0, 5))).toBe('00:05');
  });
});
