import { fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockData } from './data/mockData.js';
import { loadExample, mount } from './testUtils.js';

const arena = () => loadExample('valid/arena.json');
const open = (config, extra = {}) => ({ ...createMockData(config), open: true, ...extra });
const tab = (ui, name) => ui().getByRole('tab', { name });
const badgeOf = (element) => element.querySelector('.sk-badge-count, .sk-badge-dot');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
// What each line of the open chat says: a bubble's text (without its time), or the "New messages" line.
// Message and "New messages" lines; day lines are covered in messageTimes.test.js.
const chatLines = (root) => [...root().querySelectorAll('.sk-chat > :not(.sk-day-line)')].map((line) => (line.querySelector('.sk-bubble') ?? line).textContent);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('unread badges on the tabs', () => {
  it('counts friend requests and unread direct messages, and puts a dot on the clan when its chat is not on screen', () => {
    const config = arena();
    // Unread clan messages (1), Ben (1), Cara (1); Dana's request.
    const { ui } = mount(config, open(config, { tab: 'clan', screen: 'members' }));

    expect(badgeOf(tab(ui, 'Friends'))).toHaveTextContent('1');
    expect(tab(ui, 'Friends')).toHaveAccessibleDescription('1 friend request');
    expect(badgeOf(tab(ui, 'Chat'))).toHaveTextContent('2');
    expect(tab(ui, 'Chat')).toHaveAccessibleDescription('2 unread messages');
    expect(badgeOf(tab(ui, 'Clan'))).toHaveClass('sk-badge-dot');
    expect(tab(ui, 'Clan')).toHaveAccessibleDescription('New messages in the clan chat');
  });

  it('does not badge the clan chat while Home shows it', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'clan', screen: 'home' }));

    expect(badgeOf(tab(ui, 'Clan'))).toBeNull();
  });

  it('keeps counting friend requests on the Friends tab while it is open, as they still wait for an answer', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'friends' }));

    expect(tab(ui, 'Friends')).toHaveAttribute('aria-selected', 'true');
    expect(badgeOf(tab(ui, 'Friends'))).toHaveTextContent('1');
    expect(tab(ui, 'Friends')).toHaveAccessibleDescription('1 friend request');
  });

  it('writes 9+ for big counts and ignores counts that are not positive numbers', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'friends', unread: { clan: -2, direct: { 'f-ben': 40, 'f-cara': 'lots' } } }));

    expect(badgeOf(tab(ui, 'Chat'))).toHaveTextContent('9+');
    expect(tab(ui, 'Chat')).toHaveAccessibleDescription('40 unread messages');
    expect(badgeOf(tab(ui, 'Clan'))).toBeNull();
  });

  it('shows no badges when the host sends no unread counts and no requests', () => {
    const config = arena();
    const { root } = mount(config, open(config, { tab: 'friends', unread: undefined, requests: [] }));

    expect(root().querySelectorAll('.sk-badge-count, .sk-badge-dot')).toHaveLength(0);
  });
});

describe('unread conversations', () => {
  it('shows unread conversations in bold with their count in the list', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'chat' }));
    const row = (name) => ui().getByRole('button', { name: new RegExp(`^${name}`) });

    expect(row('Ben')).toHaveAttribute('data-unread', 'true');
    expect(badgeOf(row('Ben'))).toHaveTextContent('1');
    expect(row('Ben')).toHaveAccessibleName(/1 unread$/);
    expect(row('Eli')).toHaveAttribute('data-unread', 'false');
    expect(badgeOf(row('Eli'))).toBeNull();
  });

  it('opens an unread conversation at a "New messages" line, tells the host it was read, and stops counting it', async () => {
    const config = arena();
    const actions = { markRead: vi.fn() };
    const { ui, root } = mount(config, open(config, { tab: 'chat', actions }));

    fireEvent.click(ui().getByRole('button', { name: /^Ben/ }));

    const lines = chatLines(root);
    expect(lines).toEqual(['gg, rematch?', 'Sure, 2 min', 'New messages', 'that last round was ****']);
    // Only Cara's message is left on the Chat tab while Ben's conversation is open.
    expect(badgeOf(tab(ui, 'Chat'))).toHaveTextContent('1');

    await settle();

    expect(actions.markRead).toHaveBeenCalledWith('f-ben');
    expect(actions.markRead).toHaveBeenCalledTimes(1);
  });

  it('counts only other players\' messages when placing the line, skipping the player\'s own replies', () => {
    const config = arena();
    // Cara: "Saw your clan…", You: "Join Nova tonight?", Cara: "Send me the clan…". Two unread are Cara's two.
    const { root } = mount(config, open(config, { tab: 'chat', convo: 'f-cara', unread: { direct: { 'f-cara': 2 } } }));

    const lines = chatLines(root);
    expect(lines).toEqual(['New messages', 'Saw your clan, looks good', 'Join Nova tonight?', 'Send me the clan, I will join']);
  });

  it('keeps the "New messages" line while the conversation stays open after the host clears the count', async () => {
    const config = arena();
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const { handle, root } = mount(config, data);

    handle.update(config, { ...data, unread: { clan: 1, direct: { 'f-cara': 1 } } });

    expect(root().querySelector('[data-key="new-messages"]')).not.toBeNull();
  });

  it('removes the "New messages" line once the player sends a message there, in a direct message and in the clan chat', () => {
    const config = arena();
    const direct = mount(config, open(config, { tab: 'chat', convo: 'f-ben' }));

    expect(direct.root().querySelector('[data-key="new-messages"]')).not.toBeNull();

    fireEvent.input(direct.ui().getByRole('textbox', { name: 'Message…' }), { target: { value: 'on my way' } });
    fireEvent.click(direct.ui().getByRole('button', { name: 'Send' }));

    expect(direct.root().querySelector('[data-key="new-messages"]')).toBeNull();

    document.body.innerHTML = '';
    const clan = mount(config, open(config, { tab: 'clan', screen: 'home' }));

    expect(clan.root().querySelector('[data-key="new-messages"]')).not.toBeNull();

    fireEvent.input(clan.ui().getByRole('textbox', { name: 'Message…' }), { target: { value: 'coming' } });
    fireEvent.keyDown(clan.ui().getByRole('textbox', { name: 'Message…' }), { key: 'Enter' });

    expect(clan.root().querySelector('[data-key="new-messages"]')).toBeNull();
  });

  it('removes the "New messages" line when the player\'s own message arrives from the host, without sendMessage', () => {
    const config = arena();
    // A host that sends messages itself (or the player wrote from another tab): only the data says so.
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const { handle, root } = mount(config, data);

    expect(root().querySelector('[data-key="new-messages"]')).not.toBeNull();

    // Another player's message keeps the line.
    const other = { ...data, threads: { ...data.threads, 'f-ben': [...data.threads['f-ben'], { id: 'y', from: 'Ben', body: 'still there?', mine: false }] } };
    handle.update(config, other);
    expect(root().querySelector('[data-key="new-messages"]')).not.toBeNull();

    handle.update(config, { ...other, threads: { ...other.threads, 'f-ben': [...other.threads['f-ben'], { id: 'z', from: 'You', body: 'yes', mine: true }] } });
    expect(root().querySelector('[data-key="new-messages"]')).toBeNull();

    // In the clan chat too.
    document.body.innerHTML = '';
    const clanData = open(config, { tab: 'clan', screen: 'home' });
    const clan = mount(config, clanData);
    expect(clan.root().querySelector('[data-key="new-messages"]')).not.toBeNull();
    clan.handle.update(config, { ...clanData, messages: [...clanData.messages, { id: 'c', from: 'You', body: 'coming', mine: true }] });
    expect(clan.root().querySelector('[data-key="new-messages"]')).toBeNull();
  });

  it('keeps the line when typing has not been sent yet, and does not bring it back after sending', () => {
    const config = arena();
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const { handle, ui, root } = mount(config, data);

    fireEvent.input(ui().getByRole('textbox', { name: 'Message…' }), { target: { value: 'typing…' } });

    expect(root().querySelector('[data-key="new-messages"]')).not.toBeNull();

    fireEvent.click(ui().getByRole('button', { name: 'Send' }));
    // The host adds the message and still reports Ben's message as unread (it has not cleared yet).
    handle.update(config, { ...data, threads: { ...data.threads, 'f-ben': [...data.threads['f-ben'], { id: 'x', from: 'You', body: 'typing…', mine: true }] } });

    expect(root().querySelector('[data-key="new-messages"]')).toBeNull();
  });

  it('marks the clan chat read when Home shows it, with the line above the first unread message', async () => {
    const config = arena();
    const actions = { markRead: vi.fn() };
    const { root } = mount(config, open(config, { tab: 'clan', screen: 'home', actions }));

    const lines = chatLines(root);
    expect(lines.at(-2)).toBe('New messages');
    expect(lines.at(-1)).toContain('On my way');

    await settle();

    expect(actions.markRead).toHaveBeenCalledWith('clan');
  });
});

describe('announcing news to screen readers', () => {
  it('says what arrived since the last update, but not in the conversation on screen', () => {
    const config = arena();
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const { handle, shadow } = mount(config, data);
    const announcer = shadow.querySelector('[data-clan-ui-announcer]');

    handle.update(config, {
      ...data,
      requests: [...data.requests, { id: 'r-zoe', name: 'Zoe' }],
      unread: { clan: 2, direct: { 'f-ben': 3, 'f-cara': 2 } },
    });

    expect(announcer).toHaveAttribute('aria-live', 'polite');
    expect(announcer).toHaveTextContent('New friend request. New message from Cara. New message in Nova Squad');
    expect(within(announcer).queryByText(/Ben/)).toBeNull();
  });
});

describe('the "New messages" line when messages arrive after the conversation opens', () => {
  const config = arena();
  const ben = (id, mine = false) => ({ id, from: mine ? 'You' : 'Ben', body: id, mine });
  // A host that loads a conversation's history only once it opens: first nothing (or just the last message), then all.
  const withBen = (data, messages, unread) => ({ ...data, threads: { ...data.threads, 'f-ben': messages }, unread: { direct: { 'f-ben': unread } } });
  const lineBefore = (root) => {
    const line = root().querySelector('[data-key="new-messages"]');
    return line ? (line.nextElementSibling?.querySelector('.sk-bubble') ?? line.nextElementSibling)?.textContent : null;
  };

  it('waits for the messages when the conversation opens before they arrive', () => {
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const { handle, root } = mount(config, withBen(data, [], 2));

    expect(root().querySelector('[data-key="new-messages"]')).toBeNull();

    handle.update(config, withBen(data, [ben('old'), ben('b1'), ben('b2')], 2));
    expect(lineBefore(root)).toBe('b1');
  });

  it('starts at the only message it has and moves up when older ones load; later messages do not move it', () => {
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const { handle, root } = mount(config, withBen(data, [ben('b3')], 3));

    expect(lineBefore(root)).toBe('b3');

    // History loads above it; the host has cleared the count by now.
    handle.update(config, withBen(data, [ben('old'), ben('mine-old', true), ben('b1'), ben('b2'), ben('b3')], 0));
    expect(lineBefore(root)).toBe('b1');

    handle.update(config, withBen(data, [ben('old'), ben('mine-old', true), ben('b1'), ben('b2'), ben('b3'), ben('b4')], 0));
    expect(lineBefore(root)).toBe('b1');
  });

  it('stays at the same message when older history loads above it', () => {
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const { handle, root } = mount(config, withBen(data, [ben('old'), ben('b1')], 1));

    expect(lineBefore(root)).toBe('b1');
    handle.update(config, withBen(data, [ben('older1'), ben('older2'), ben('old'), ben('b1')], 0));
    expect(lineBefore(root)).toBe('b1');
  });

  it('only a message the player sends after it opened removes the line, not an older one of theirs', () => {
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const { handle, root } = mount(config, withBen(data, [ben('b1')], 2));

    handle.update(config, withBen(data, [ben('b0'), ben('mine-old', true), ben('b1')], 0));
    expect(lineBefore(root)).toBe('b0');

    handle.update(config, withBen(data, [ben('b0'), ben('mine-old', true), ben('b1'), ben('reply', true)], 0));
    expect(root().querySelector('[data-key="new-messages"]')).toBeNull();
  });

  it('also in the clan chat: a fresh mount before the messages arrive still gets its line', () => {
    const clanData = open(config, { tab: 'clan', screen: 'home' });
    const { handle, root } = mount(config, { ...clanData, messages: [], unread: { clan: 2 } });

    expect(root().querySelector('[data-key="new-messages"]')).toBeNull();
    handle.update(config, { ...clanData, messages: [ben('c0'), ben('c1'), ben('c2')], unread: { clan: 2 } });
    expect(lineBefore(root)).toBe('c1');
  });
});
