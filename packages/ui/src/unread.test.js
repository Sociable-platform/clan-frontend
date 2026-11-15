import { fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockData } from './data/mockData.js';
import { loadExample, mount } from './testUtils.js';

const arena = () => loadExample('valid/arena.json');
const open = (config, extra = {}) => ({ ...createMockData(config), open: true, ...extra });
const tab = (ui, name) => ui().getByRole('tab', { name });
const badgeOf = (element) => element.querySelector('.sk-badge-count, .sk-badge-dot');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

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

    const lines = [...root().querySelector('.sk-chat').children].map((line) => line.textContent);
    expect(lines).toEqual(['gg, rematch?', 'Sure, 2 min', 'New messages', 'that last round was ****']);
    // Only Cara's message is left on the Chat tab while Ben's conversation is open.
    expect(badgeOf(tab(ui, 'Chat'))).toHaveTextContent('1');

    await settle();

    expect(actions.markRead).toHaveBeenCalledWith('f-ben');
    expect(actions.markRead).toHaveBeenCalledTimes(1);
  });

  it('counts only other players\' messages when placing the line, skipping the player\'s own replies', () => {
    const config = arena();
    // Cara: "Saw your clan tag…", You: "Join Nova tonight?", Cara: "Send me the clan…". Two unread are Cara's two.
    const { root } = mount(config, open(config, { tab: 'chat', convo: 'f-cara', unread: { direct: { 'f-cara': 2 } } }));

    const lines = [...root().querySelector('.sk-chat').children].map((line) => line.textContent);
    expect(lines).toEqual(['New messages', 'Saw your clan tag, looks good', 'Join Nova tonight?', 'Send me the clan, I will join']);
  });

  it('keeps the "New messages" line while the conversation stays open after the host clears the count', async () => {
    const config = arena();
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const { handle, root } = mount(config, data);

    handle.update(config, { ...data, unread: { clan: 1, direct: { 'f-cara': 1 } } });

    expect(root().querySelector('[data-key="new-messages"]')).not.toBeNull();
  });

  it('marks the clan chat read when Home shows it, with the line above the first unread message', async () => {
    const config = arena();
    const actions = { markRead: vi.fn() };
    const { root } = mount(config, open(config, { tab: 'clan', screen: 'home', actions }));

    const lines = [...root().querySelector('.sk-chat').children].map((line) => line.textContent);
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
