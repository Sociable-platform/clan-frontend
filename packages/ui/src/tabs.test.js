import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockData } from './data/mockData.js';
import { loadExample, mount } from './testUtils.js';

afterEach(() => {
  document.body.replaceChildren();
});

const arena = () => loadExample('valid/arena.json');
const open = (config, extra = {}) => ({ ...createMockData(config), open: true, ...extra });

describe('friends tab', () => {
  it('lists the friends with their status and online state', () => {
    const config = arena();
    const { ui, root } = mount(config, open(config, { tab: 'friends' }));

    expect(ui().getByRole('tab', { name: 'Friends', selected: true })).toBeInTheDocument();
    expect(ui().getByText('Friends · 3')).toBeInTheDocument();
    expect(ui().getByText('Ben')).toBeInTheDocument();
    expect(ui().getByText('In arena')).toBeInTheDocument();
    expect(root().querySelectorAll('.sk-presence[data-online="true"]')).toHaveLength(2);
    expect(root().querySelectorAll('.sk-presence[data-online="false"]')).toHaveLength(1);
  });

  it('shows a request and accepts it through the host', () => {
    const config = arena();
    const actions = { acceptRequest: vi.fn() };
    const { ui } = mount(config, open(config, { tab: 'friends', actions }));

    expect(ui().getByText(/sent a request/)).toBeInTheDocument();

    fireEvent.click(ui().getByRole('button', { name: 'Accept · Dana' }));

    expect(actions.acceptRequest).toHaveBeenCalledWith('r-dana');
  });

  it('removes a friend through the host after a confirmation', () => {
    const config = arena();
    const actions = { removeFriend: vi.fn() };
    const { ui } = mount(config, open(config, { tab: 'friends', actions }));

    fireEvent.click(ui().getByRole('button', { name: 'Ben. Manage' }));
    fireEvent.click(ui().getByRole('button', { name: 'Remove friend' }));

    expect(ui().getByRole('alertdialog', { name: 'Remove Ben' })).toBeInTheDocument();
    expect(actions.removeFriend).not.toHaveBeenCalled();

    fireEvent.click(ui().getByRole('button', { name: 'Remove' }));

    expect(actions.removeFriend).toHaveBeenCalledWith(expect.any(String));
    expect(ui().queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('blocks a friend through the host after a confirmation', () => {
    const config = arena();
    const actions = { blockFriend: vi.fn(), removeFriend: vi.fn() };
    const { ui } = mount(config, open(config, { tab: 'friends', actions }));

    fireEvent.click(ui().getByRole('button', { name: 'Ben. Manage' }));
    fireEvent.click(ui().getByRole('button', { name: 'Block' }));

    expect(ui().getByRole('alertdialog', { name: 'Block Ben' })).toBeInTheDocument();
    expect(actions.blockFriend).not.toHaveBeenCalled();

    fireEvent.click(ui().getByRole('button', { name: 'Block' }));

    expect(actions.blockFriend).toHaveBeenCalledWith(expect.any(String));
    expect(actions.removeFriend).not.toHaveBeenCalled();
    expect(ui().queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('keeps the friend when the removal is cancelled or the row is closed', () => {
    const config = arena();
    const actions = { removeFriend: vi.fn() };
    const { ui } = mount(config, open(config, { tab: 'friends', actions }));

    fireEvent.click(ui().getByRole('button', { name: 'Ben. Manage' }));
    fireEvent.click(ui().getByRole('button', { name: 'Remove friend' }));
    fireEvent.click(ui().getByRole('button', { name: 'Cancel' }));

    expect(ui().queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Remove friend' })).toBeInTheDocument();

    fireEvent.click(ui().getByRole('button', { name: 'Ben. Manage' }));

    expect(ui().queryByRole('button', { name: 'Remove friend' })).not.toBeInTheDocument();
    expect(actions.removeFriend).not.toHaveBeenCalled();
  });

  it('closes the manage panel when that friend is no longer in the list', () => {
    const config = arena();
    const data = open(config, { tab: 'friends' });
    const { ui, handle } = mount(config, data);

    fireEvent.click(ui().getByRole('button', { name: 'Ben. Manage' }));
    handle.update(config, { ...data, friends: data.friends.filter((friend) => friend.name !== 'Ben') });

    expect(ui().queryByText('Ben')).not.toBeInTheDocument();
    expect(ui().queryByRole('button', { name: 'Remove friend' })).not.toBeInTheDocument();
  });

  it('has a Blocked drop-down that is closed by default and lists the blocked players when opened', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'friends' }));

    expect(ui().getByRole('button', { name: 'Blocked · 2' })).toHaveAttribute('aria-expanded', 'false');
    expect(ui().queryByRole('button', { name: 'Unblock Finn' })).not.toBeInTheDocument();

    fireEvent.click(ui().getByRole('button', { name: 'Blocked · 2' }));

    expect(ui().getByRole('button', { name: 'Blocked · 2' })).toHaveAttribute('aria-expanded', 'true');
    expect(ui().getByRole('button', { name: 'Unblock Finn' })).toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Unblock Gina' })).toBeInTheDocument();

    fireEvent.click(ui().getByRole('button', { name: 'Blocked · 2' }));

    expect(ui().queryByRole('button', { name: 'Unblock Finn' })).not.toBeInTheDocument();
  });

  it('unblocks a player through the host when the player is pressed', () => {
    const config = arena();
    const actions = { unblock: vi.fn() };
    const { ui, shadow } = mount(config, open(config, { tab: 'friends', actions }));

    fireEvent.click(ui().getByRole('button', { name: 'Blocked · 2' }));
    fireEvent.click(ui().getByRole('button', { name: 'Unblock Finn' }));

    expect(actions.unblock).toHaveBeenCalledWith('b-finn');
    expect(shadow.activeElement).toBe(ui().getByRole('button', { name: 'Blocked · 2' }));
  });

  it('shows a note when nobody is blocked, and drops a player the host no longer lists', () => {
    const config = arena();
    const data = open(config, { tab: 'friends' });
    const { ui, handle } = mount(config, data);
    fireEvent.click(ui().getByRole('button', { name: 'Blocked · 2' }));

    handle.update(config, { ...data, blocked: data.blocked.filter((player) => player.name !== 'Finn') });

    expect(ui().queryByRole('button', { name: 'Unblock Finn' })).not.toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Unblock Gina' })).toBeInTheDocument();

    handle.update(config, { ...data, blocked: [] });

    expect(ui().getByText('You have not blocked anyone.')).toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Blocked · 0' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('declines a request through the host', () => {
    const config = arena();
    const actions = { acceptRequest: vi.fn(), declineRequest: vi.fn() };
    const { ui } = mount(config, open(config, { tab: 'friends', actions }));

    fireEvent.click(ui().getByRole('button', { name: 'Decline · Dana' }));

    expect(actions.declineRequest).toHaveBeenCalledWith('r-dana');
    expect(actions.acceptRequest).not.toHaveBeenCalled();
  });

  it('filters the friends as the player types', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'friends' }));

    fireEvent.input(ui().getByRole('searchbox', { name: 'Search players…' }), { target: { value: 'car' } });

    expect(ui().getByText('Cara').closest('.sk-friend')).toHaveProperty('hidden', false);
    expect(ui().getByText('Ben').closest('.sk-friend')).toHaveProperty('hidden', true);
  });

  it('opens a direct message from the Chat button, with a way back', () => {
    const config = arena();
    const actions = { tabChanged: vi.fn() };
    const { ui } = mount(config, open(config, { tab: 'friends', actions }));

    fireEvent.click(ui().getByRole('button', { name: 'Chat · Cara' }));

    expect(actions.tabChanged).toHaveBeenCalledWith('chat');
    expect(ui().getByRole('tab', { name: 'Chat', selected: true })).toBeInTheDocument();
    expect(ui().getByText('Join Nova tonight?')).toBeInTheDocument();

    fireEvent.click(ui().getByRole('button', { name: 'Back to Friends' }));

    expect(actions.tabChanged).toHaveBeenLastCalledWith('friends');
    expect(ui().getByText('Friends · 3')).toBeInTheDocument();
  });

  it('has no Chat buttons when direct messages are off', () => {
    const config = arena();
    config.chat.directMessages = false;
    const { ui } = mount(config, open(config, { tab: 'friends' }));

    expect(ui().queryByRole('button', { name: /^Chat/ })).not.toBeInTheDocument();
  });

  it('uses the config label for the Chat button and the tab', () => {
    const config = arena();
    config.texts.labels = { chatBtn: 'Message', tabFriends: 'Buddies' };
    const { ui } = mount(config, open(config, { tab: 'friends' }));

    expect(ui().getByRole('button', { name: 'Message · Ben' })).toBeInTheDocument();
    expect(ui().getByText('Buddies · 3')).toBeInTheDocument();
  });
});

describe('chat tab', () => {
  it('opens the first conversation and offers every friend and the clan', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'chat' }));

    expect(ui().getByRole('button', { name: 'Ben', pressed: true })).toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Nova Squad', pressed: false })).toBeInTheDocument();
    expect(ui().getByText('gg, rematch?')).toBeInTheDocument();
    expect(ui().getByText('In arena')).toBeInTheDocument();
    expect(ui().queryByRole('button', { name: /^Back to/ })).not.toBeInTheDocument();
  });

  it('switches conversation and names the clan chat after the game word', () => {
    const config = arena();
    config.texts.terms = { clan: 'Guild', clans: 'Guilds' };
    config.texts.labels = {};
    const { ui } = mount(config, open(config, { tab: 'chat' }));

    fireEvent.click(ui().getByRole('button', { name: 'Nova Squad' }));

    expect(ui().getByText('Nova Squad · guild chat')).toBeInTheDocument();
    expect(ui().getByText('4 members · one channel per clan')).toBeInTheDocument();
    expect(ui().getByText('Raid at 9?')).toBeInTheDocument();
  });

  it('hides the profanity-filtered word text exactly as the host sent it', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'chat' }));

    expect(ui().getByText('that last round was ****')).toBeInTheDocument();
  });

  it('only offers the clan chat to a player in a clan, and only friends when clan chat is off', () => {
    const config = arena();
    const noClan = mount(config, { ...createMockData(config, { inClan: false }), open: true, tab: 'chat' });

    expect(noClan.ui().queryByRole('button', { name: 'Nova Squad' })).not.toBeInTheDocument();

    const off = arena();
    off.chat.clanChat = false;
    const view = mount(off, open(off, { tab: 'chat' }));

    expect(view.ui().queryByRole('button', { name: 'Nova Squad' })).not.toBeInTheDocument();
    expect(view.ui().getByRole('button', { name: 'Eli' })).toBeInTheDocument();
  });

  it('has no Chat tab when direct messages and clan chat are both off', () => {
    const config = arena();
    config.chat.directMessages = false;
    config.chat.clanChat = false;
    config.friends.enabled = true;
    const { ui } = mount(config, { ...open(config), tab: 'chat' });

    expect(ui().queryByRole('tab', { name: 'Chat' })).not.toBeInTheDocument();
  });

  it('sends a typed message with the conversation it belongs to', () => {
    const config = arena();
    const actions = { sendMessage: vi.fn() };
    const { ui } = mount(config, open(config, { tab: 'chat', actions }));

    fireEvent.input(ui().getByRole('textbox', { name: 'Message…' }), { target: { value: 'on my way' } });
    fireEvent.click(ui().getByRole('button', { name: 'Send' }));

    expect(actions.sendMessage).toHaveBeenCalledWith('on my way', { conversation: 'f-ben' });
    expect(ui().getByRole('textbox', { name: 'Message…' })).toHaveValue('');
  });

  it('shows names only above other players in the clan chat, and none in a direct message', () => {
    const config = arena();
    const { ui, root } = mount(config, open(config, { tab: 'chat', convo: 'clan' }));

    expect([...root().querySelectorAll('.sk-msg .sk-small')].map((name) => name.textContent)).toEqual(['Ben', 'Cara']);

    fireEvent.click(ui().getByRole('button', { name: 'Ben' }));

    expect(root().querySelectorAll('.sk-msg .sk-small')).toHaveLength(0);
  });

  it('draws the conversation as a log when the layout is log', () => {
    const config = arena();
    config.chat.layout = 'log';
    const { ui } = mount(config, open(config, { tab: 'chat', convo: 'clan' }));

    expect(ui().getByText('[NOVA] Cara')).toBeInTheDocument();
  });

  it('follows the host when it asks for another tab', () => {
    const config = arena();
    const { handle, ui } = mount(config, open(config, { tab: 'friends' }));

    handle.update(config, open(config, { tab: 'chat' }));

    expect(ui().getByRole('tab', { name: 'Chat', selected: true })).toBeInTheDocument();
  });
});

describe('a long conversation', () => {
  const longChat = (config) => {
    const data = open(config, { tab: 'chat', convo: 'clan' });
    const more = Array.from({ length: 30 }, (_, index) => ({ id: `more-${index}`, from: 'You', body: `message ${index}`, mine: true }));
    return { ...data, messages: [...data.messages, ...more] };
  };

  it('keeps the conversation name and the message box outside the list that scrolls', () => {
    const config = arena();
    const { root, ui } = mount(config, longChat(config));
    const list = ui().getByRole('log');

    expect(list).toHaveAttribute('data-key', 'chat');
    expect(list.children.length).toBeGreaterThan(30);
    expect(list).not.toContainElement(root().querySelector('.sk-bar-divided'));
    expect(list).not.toContainElement(root().querySelector('.sk-chips'));
    expect(list).not.toContainElement(ui().getByRole('textbox', { name: 'Message…' }));
  });

  it('does the same for the clan chat on the home screen: the clan card stays above the list', () => {
    const config = arena();
    const data = longChat(config);
    const { root, ui } = mount(config, { ...data, tab: 'clan', convo: undefined });
    const list = ui().getByRole('log');

    expect(list.children.length).toBeGreaterThan(30);
    expect(list).not.toContainElement(root().querySelector('.sk-composer'));
    expect(list.parentElement).toBe(root().querySelector('[data-key="content"]'));
  });
});
