import { h, icon } from '../dom/h.js';
import { button } from './button.js';
import { clanTagPrefix } from './clanChat.js';
import { composer, messageList, NAMES } from './thread.js';

/** The conversations the player can open: friends (when direct messages are on) and the clan (when its chat is on and they are in one). */
export function conversationsOf(config, data) {
  const chat = config?.chat ?? {};
  const directMessages = chat.enabled === true && chat.directMessages === true;
  const clanChat = chat.enabled === true && chat.clanChat === true && config?.clan?.enabled === true && data.clan != null;
  return [
    ...(directMessages ? (data.friends ?? []).map((friend) => ({ id: friend.id, title: friend.name, subtitle: friend.status, messages: data.threads?.[friend.id] ?? [], isGroup: false })) : []),
    ...(clanChat ? [{ id: 'clan', title: data.clan.name, isGroup: true, messages: data.messages ?? [] }] : []),
  ];
}

/** Chat: pick a conversation, read it, and write in it. A back button returns to where the player came from. */
export function chatTab({ config, L, data, ui, act }) {
  const conversations = conversationsOf(config, data);
  const current = conversations.find((conversation) => conversation.id === ui.convo) ?? conversations[0] ?? null;
  const showBack = ui.backTo != null;
  const tabNames = { friends: L.tabFriends, clan: L.tabClan, chat: L.tabChat };

  const chips = h(
    'div',
    { class: 'sk-chips' },
    conversations.map((conversation) =>
      h('button', {
        class: 'sk-chip',
        text: conversation.id === 'clan' ? data.clan.name : conversation.title,
        attrs: { type: 'button', 'aria-pressed': conversation.id === current?.id },
        on: { click: () => act.selectConversation(conversation.id) },
      }),
    ),
  );

  if (!current) {
    return [chips, h('div', { class: 'sk-hint', text: 'No conversations yet.' })];
  }

  const subtitle = current.isGroup ? `${data.clan.memberCount ?? ''} members · one channel per clan` : current.subtitle;
  const title = current.isGroup ? `${current.title} · ${L.clanChatTitle}` : current.title;

  return [
    chips,
    h('div', { class: 'sk-bar sk-bar-divided' }, [
      showBack ? button({ variant: 'icon', onClick: act.goBack, attrs: { 'aria-label': `Back to ${tabNames[ui.backTo]}` }, children: [icon('back', 16)] }) : null,
      h('span', { class: 'sk-row-main' }, [h('span', { class: 'sk-card-title', text: title }), h('span', { class: 'sk-label', text: subtitle })]),
    ]),
    messageList({
      config,
      messages: current.messages,
      names: current.isGroup ? NAMES.OTHERS : NAMES.NONE,
      tagPrefix: current.isGroup ? clanTagPrefix(config, data.clan) : '',
      label: title,
    }),
    composer({ config, L, ui, act, conversation: current.id }),
  ];
}
