import { fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockData } from './data/mockData.js';
import { loadExample, mount } from './testUtils.js';

afterEach(() => {
  document.body.replaceChildren();
});

const arena = () => loadExample('valid/arena.json');
const open = (config, extra = {}) => ({ ...createMockData(config), open: true, ...extra });

describe('friends tab', () => {
  it('lists the friends with the clan each is in under the name, and online or offline as the dot on the picture', () => {
    const config = arena();
    const { ui, root } = mount(config, open(config, { tab: 'friends' }));
    const rows = [...root().querySelectorAll('.sk-friend-select')].map((row) => [...row.querySelector('.sk-row-main').children].map((line) => line.textContent));

    expect(ui().getByRole('tab', { name: 'Friends', selected: true })).toBeInTheDocument();
    expect(ui().getByText('Friends · 3')).toBeInTheDocument();
    // Eli is in no clan: just the name.
    expect(rows).toEqual([['Ben', 'Nova Squad'], ['Cara', 'Harbor Crew'], ['Eli']]);
    expect(root().querySelectorAll('.sk-presence[data-online="true"]')).toHaveLength(2);
    expect(root().querySelectorAll('.sk-presence[data-online="false"]')).toHaveLength(1);
    // No status words: no "Online" and no "Last seen".
    expect(ui().queryByText(/^Online$|Last seen/)).not.toBeInTheDocument();
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

  it('offers chat as a small icon on each friend, named for screen readers, with no "Chat" text in the row', () => {
    const config = arena();
    const actions = { tabChanged: vi.fn() };
    const { ui } = mount(config, open(config, { tab: 'friends', actions }));
    const chat = ui().getByRole('button', { name: 'Chat · Ben' });

    expect(chat).toHaveTextContent(/^$/);
    expect(chat.querySelector('svg')).not.toBeNull();
    expect(chat).toHaveClass('sk-btn-icon');

    fireEvent.click(chat);

    expect(ui().getByRole('tab', { name: 'Chat', selected: true })).toBeInTheDocument();
    expect(ui().getByText('gg, rematch?')).toBeInTheDocument();
  });

  it('shows no line under the name when the host does not know the friend\'s clan, and ignores old status text', () => {
    const config = arena();
    const friends = [{ id: 'f-x', name: 'Xan', online: true, status: 'Last seen 2h ago' }, { id: 'f-y', name: 'Yu', online: false, clan: { name: '  ' } }];
    const { root } = mount(config, open(config, { tab: 'friends', friends }));

    expect([...root().querySelectorAll('.sk-friend-select .sk-row-main')].map((main) => main.children.length)).toEqual([1, 1]);
    expect(root().textContent).not.toContain('Last seen');
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

  it('drops a player the host no longer lists, and the whole Blocked section once nobody is blocked', () => {
    const config = arena();
    const data = open(config, { tab: 'friends' });
    const { ui, handle } = mount(config, data);
    fireEvent.click(ui().getByRole('button', { name: 'Blocked · 2' }));

    handle.update(config, { ...data, blocked: data.blocked.filter((player) => player.name !== 'Finn') });

    expect(ui().queryByRole('button', { name: 'Unblock Finn' })).not.toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Unblock Gina' })).toBeInTheDocument();

    handle.update(config, { ...data, blocked: [] });

    expect(ui().queryByRole('button', { name: /^Blocked/ })).not.toBeInTheDocument();
    expect(ui().queryByText('You have not blocked anyone.')).not.toBeInTheDocument();
  });

  it('has no Blocked section for a player who blocked nobody', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'friends', blocked: [] }));

    expect(ui().queryByRole('button', { name: /^Blocked/ })).not.toBeInTheDocument();
  });

  it('moves the focus to the player search when the last blocked player is unblocked', () => {
    const config = arena();
    const actions = { unblock: vi.fn() };
    const data = open(config, { tab: 'friends', actions, blocked: [{ id: 'b-finn', name: 'Finn' }] });
    const { ui, shadow, handle } = mount(config, data);

    fireEvent.click(ui().getByRole('button', { name: 'Blocked · 1' }));
    fireEvent.click(ui().getByRole('button', { name: 'Unblock Finn' }));
    handle.update(config, { ...data, blocked: [] });

    expect(actions.unblock).toHaveBeenCalledWith('b-finn');
    expect(shadow.activeElement).toBe(ui().getByRole('searchbox', { name: 'Search players…' }));
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

describe('message counter', () => {
  it('shows only from 240 of 300 characters on, and goes again below that', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'chat', convo: 'f-ben' }));
    const box = ui().getByRole('textbox', { name: 'Message…' });
    const meta = () => ui().getByText(/\/ 300$/).closest('.sk-meta');

    fireEvent.input(box, { target: { value: 'x'.repeat(239) } });

    expect(meta()).toHaveProperty('hidden', true);

    fireEvent.input(box, { target: { value: 'x'.repeat(240) } });

    expect(meta()).toHaveProperty('hidden', false);
    expect(meta()).toHaveTextContent('240 / 300');

    fireEvent.input(box, { target: { value: 'short' } });

    expect(meta()).toHaveProperty('hidden', true);
  });

  it('keeps showing for a long draft after a repaint', () => {
    const config = arena();
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const { handle, ui } = mount(config, data);

    fireEvent.input(ui().getByRole('textbox', { name: 'Message…' }), { target: { value: 'x'.repeat(250) } });
    handle.update(config, { ...data });

    expect(ui().getByText('250 / 300').closest('.sk-meta')).toHaveProperty('hidden', false);
  });
});

describe('chat tab', () => {
  it('opens on the conversation list: every friend with their last message, but not the clan', () => {
    const config = arena();
    const { ui, root } = mount(config, open(config, { tab: 'chat' }));
    const list = ui().getByRole('list', { name: 'Conversations' });

    const rows = within(list).getAllByRole('button');

    expect(rows.map((row) => `${row.querySelector('.sk-friend-name').textContent}: ${row.querySelector('.sk-desc').textContent}`)).toEqual([
      'Ben: that last round was ****',
      'Cara: Send me the clan, I will join',
      'Eli: brb, dinner',
    ]);
    // The clan chat lives on the Clan tab's home screen.
    expect(ui().queryByRole('button', { name: /Nova Squad/ })).not.toBeInTheDocument();
    // No conversation is open yet: no messages, no message box, no back button.
    expect(root().querySelector('.sk-msg')).toBeNull();
    expect(ui().queryByRole('textbox', { name: 'Message…' })).not.toBeInTheDocument();
    expect(ui().queryByRole('button', { name: /^Back to/ })).not.toBeInTheDocument();
  });

  it('marks the player\'s own last message with "You:" and says "No messages yet" before anyone wrote', () => {
    const config = arena();
    const data = open(config, { tab: 'chat' });
    data.threads = { ...data.threads, 'f-ben': [{ id: 'x', from: 'You', body: 'on my way', mine: true }], 'f-eli': [] };
    const { ui } = mount(config, data);

    expect(ui().getByText('You: on my way')).toBeInTheDocument();
    expect(ui().getByText('No messages yet')).toBeInTheDocument();
  });

  it('opens a conversation from the list without the friend picker above it, and goes back to the list', () => {
    const config = arena();
    const { ui, root } = mount(config, open(config, { tab: 'chat' }));

    fireEvent.click(ui().getByRole('button', { name: /^Ben/ }));

    expect(root().querySelector('.sk-convo-list')).toBeNull();
    expect(root().querySelector('.sk-bar-divided')).toHaveAttribute('data-conversation', 'f-ben');
    expect(ui().getByText('gg, rematch?')).toBeInTheDocument();
    // The header shows the friend's clan under the name.
    expect(root().querySelector('.sk-bar-divided .sk-label')).toHaveTextContent('Nova Squad');

    fireEvent.click(ui().getByRole('button', { name: 'Back to conversations' }));

    expect(ui().getByRole('list', { name: 'Conversations' })).toBeInTheDocument();
  });

  it('opens on the list again when the player taps the Chat tab', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'chat', convo: 'f-ben' }));

    expect(ui().getByText('gg, rematch?')).toBeInTheDocument();

    fireEvent.click(ui().getByRole('tab', { name: 'Friends' }));
    fireEvent.click(ui().getByRole('tab', { name: 'Chat' }));

    expect(ui().getByRole('list', { name: 'Conversations' })).toBeInTheDocument();
  });

  it('searches the list by name and by what was written, keeping the search box focused', () => {
    const config = arena();
    const { ui, shadow } = mount(config, open(config, { tab: 'chat' }));
    const search = ui().getByRole('searchbox', { name: 'Search chats…' });
    const shown = () => within(ui().getByRole('list', { name: 'Conversations' })).queryAllByRole('button').map((row) => row.querySelector('.sk-friend-name').textContent);

    search.focus();
    fireEvent.input(search, { target: { value: 'cA' } });

    expect(shown()).toEqual(['Cara']);
    expect(shadow.activeElement).toBe(search);

    // "rematch" is in Ben's conversation, not his last message.
    fireEvent.input(search, { target: { value: 'rematch' } });

    expect(shown()).toEqual(['Ben']);

    fireEvent.input(search, { target: { value: 'zzz' } });

    expect(shown()).toEqual([]);
    expect(ui().getByRole('status')).toHaveTextContent('No chats match "zzz"');

    fireEvent.input(search, { target: { value: '' } });

    expect(shown()).toEqual(['Ben', 'Cara', 'Eli']);
  });

  it('says so when there is nobody to chat with yet', () => {
    const config = arena();
    const { ui } = mount(config, { ...open(config, { tab: 'chat' }), friends: [] });

    expect(ui().getByText('No conversations yet. Add a friend to start chatting.')).toBeInTheDocument();
    expect(ui().queryByRole('searchbox', { name: 'Search chats…' })).not.toBeInTheDocument();
  });

  it('hides the profanity-filtered word text exactly as the host sent it', () => {
    const config = arena();
    const { ui } = mount(config, open(config, { tab: 'chat', convo: 'f-ben' }));

    expect(within(ui().getByRole('log')).getByText('that last round was ****')).toBeInTheDocument();
  });

  it('has no Chat tab when direct messages are off, even with clan chat on', () => {
    const config = arena();
    config.chat.directMessages = false;
    config.chat.clanChat = true;
    config.friends.enabled = true;
    const { ui } = mount(config, { ...open(config), tab: 'chat' });

    expect(ui().queryByRole('tab', { name: 'Chat' })).not.toBeInTheDocument();
  });

  it('sends a typed message with the conversation it belongs to', () => {
    const config = arena();
    const actions = { sendMessage: vi.fn() };
    const { ui } = mount(config, open(config, { tab: 'chat', convo: 'f-ben', actions }));

    fireEvent.input(ui().getByRole('textbox', { name: 'Message…' }), { target: { value: 'on my way' } });
    fireEvent.click(ui().getByRole('button', { name: 'Send' }));

    expect(actions.sendMessage).toHaveBeenCalledWith('on my way', { conversation: 'f-ben' });
    expect(ui().getByRole('textbox', { name: 'Message…' })).toHaveValue('');
  });

  it('shows no names above the messages in a direct message', () => {
    const config = arena();
    const { root } = mount(config, open(config, { tab: 'chat', convo: 'f-ben' }));

    expect(root().querySelectorAll('.sk-msg')).not.toHaveLength(0);
    expect(root().querySelectorAll('.sk-msg .sk-small')).toHaveLength(0);
  });

  it('draws the clan chat as a log when the layout is log', () => {
    const config = arena();
    config.chat.layout = 'log';
    const { ui } = mount(config, open(config, { tab: 'clan', screen: 'home' }));

    expect(ui().getAllByText('Cara').some((name) => name.classList.contains('sk-log-name'))).toBe(true);
    expect(ui().queryByText(/\[NOVA\]/)).not.toBeInTheDocument();
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
    const data = open(config, { tab: 'chat', convo: 'f-ben' });
    const more = Array.from({ length: 30 }, (_, index) => ({ id: `more-${index}`, from: 'You', body: `message ${index}`, mine: true }));
    // The same long history for the direct message with Ben and for the clan chat.
    return { ...data, messages: [...data.messages, ...more], threads: { ...data.threads, 'f-ben': [...(data.threads?.['f-ben'] ?? []), ...more] } };
  };

  it('keeps the conversation name and the message box outside the list that scrolls', () => {
    const config = arena();
    const { root, ui } = mount(config, longChat(config));
    const list = ui().getByRole('log');

    expect(list).toHaveAttribute('data-key', 'chat');
    expect(list.children.length).toBeGreaterThan(30);
    expect(list).not.toContainElement(root().querySelector('.sk-bar-divided'));
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
