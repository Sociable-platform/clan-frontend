import { friendClanName, isShown, memberLineText } from '../data/format.js';
import { badgeText, newLineIndex, rawUnread } from '../data/unread.js';
import { h, icon } from '../dom/h.js';
import { avatar } from './avatar.js';
import { button } from './button.js';
import { composer, messageList, NAMES } from './thread.js';

/** The conversations the player can open here: one per friend, when direct messages are on. The clan chat lives on the Clan tab's home screen, not here. */
export function conversationsOf(config, data) {
  const chat = config?.chat ?? {};
  if (chat.enabled !== true || chat.directMessages !== true) return [];
  return (data.friends ?? []).map((friend) => ({
    id: friend.id,
    title: friend.name,
    // Under the name in the conversation's header: the friend's clan.
    subtitle: friendClanName(friend),
    online: friend.online,
    messages: data.threads?.[friend.id] ?? [],
  }));
}

/**
 * The line under a friend's name in the list: their last message ("You: …" when it was the player's), the sentence
 * of a member change ("Ali joined the clan"), or "No messages yet". A message the panel does not draw is skipped.
 */
function previewOf(conversation, L) {
  const last = conversation.messages.filter(isShown).at(-1);
  if (!last) return 'No messages yet';
  const line = memberLineText(last, L);
  if (line !== null) return line;
  return last.mine ? `You: ${last.body}` : String(last.body ?? '');
}

const SEARCH_CHATS = 'Search chats…';

/**
 * The conversation list: a search box on top, then one row per friend with their picture, name and last
 * message. Searching matches the friend's name and the words in the conversation. Opening a row shows that conversation.
 */
function conversationList({ config, L, data, conversations, ui, act }) {
  if (conversations.length === 0) return [h('div', { class: 'sk-hint', text: 'No conversations yet. Add a friend to start chatting.' })];

  const rows = conversations.map((conversation) => {
    // An unread conversation has its name and last message in bold and a count on the right.
    const unread = rawUnread(config, data, conversation.id);
    return {
      haystack: [conversation.title, ...conversation.messages.map((message) => message.body ?? '')].join('\n').toLowerCase(),
      row: h('li', {}, [
        h(
          'button',
          {
            class: 'sk-convo',
            attrs: { type: 'button', 'data-key': `convo-${conversation.id}`, 'data-unread': unread > 0 },
            on: { click: () => act.selectConversation(conversation.id) },
          },
          [
            avatar(conversation.title, conversation.online),
            h('span', { class: 'sk-row-main' }, [h('span', { class: 'sk-friend-name', text: conversation.title }), h('span', { class: 'sk-desc', text: previewOf(conversation, L) })]),
            unread > 0 ? h('span', { class: 'sk-badge-count', text: badgeText(unread), attrs: { 'aria-hidden': 'true' } }) : null,
            unread > 0 ? h('span', { class: 'sk-sr-only', text: `, ${unread} unread` }) : null,
          ],
        ),
      ]),
    };
  });
  const noMatch = h('div', { class: 'sk-hint', attrs: { role: 'status' } });

  // Searching hides rows instead of repainting, so the box keeps focus and the caret.
  const applyFilter = () => {
    const query = ui.chatQuery.trim().toLowerCase();
    rows.forEach(({ row, haystack }) => {
      row.hidden = query !== '' && !haystack.includes(query);
    });
    const anyShown = rows.some(({ row }) => !row.hidden);
    noMatch.hidden = anyShown;
    noMatch.textContent = anyShown ? '' : `No chats match "${ui.chatQuery.trim()}"`;
  };
  const search = h('input', {
    class: 'sk-input',
    attrs: { type: 'search', placeholder: SEARCH_CHATS, 'aria-label': SEARCH_CHATS, 'data-key': 'chat-search', autocomplete: 'off' },
    on: {
      input: (event) => {
        ui.chatQuery = event.target.value;
        applyFilter();
      },
    },
  });
  search.value = ui.chatQuery;
  applyFilter();

  return [search, h('ul', { class: 'sk-convo-list', attrs: { 'aria-label': 'Conversations' } }, rows.map(({ row }) => row)), noMatch];
}

/**
 * Chat: direct messages, like a phone's chat app. The tab opens on the conversation list; picking a friend
 * opens that conversation, whose back button returns to the list (or to Friends when it was opened from there).
 * The open conversation's id is on its header (`data-conversation`) for hosts that need to know which one it is.
 */
export function chatTab({ config, L, data, ui, act }) {
  const conversations = conversationsOf(config, data);
  const current = conversations.find((conversation) => conversation.id === ui.convo) ?? null;
  if (!current) return conversationList({ config, L, data, conversations, ui, act });

  const tabNames = { friends: L.tabFriends, clan: L.tabClan, chat: L.tabChat };
  const back = ui.backTo
    ? button({ variant: 'icon', onClick: act.goBack, attrs: { 'aria-label': `Back to ${tabNames[ui.backTo]}` }, children: [icon('back', 16)] })
    : button({ variant: 'icon', onClick: () => act.selectConversation(null), attrs: { 'aria-label': 'Back to conversations' }, children: [icon('back', 16)] });

  return [
    h('div', { class: 'sk-bar sk-bar-divided', attrs: { 'data-conversation': current.id } }, [
      back,
      avatar(current.title, current.online),
      h('span', { class: 'sk-row-main' }, [h('span', { class: 'sk-card-title', text: current.title }), current.subtitle ? h('span', { class: 'sk-label', text: current.subtitle }) : null]),
    ]),
    messageList({
      config,
      L,
      messages: current.messages,
      names: NAMES.NONE,
      label: current.title,
      newFrom: newLineIndex(ui.newMessages, current.id, current.messages),
    }),
    composer({ config, L, ui, act, conversation: current.id }),
  ];
}
