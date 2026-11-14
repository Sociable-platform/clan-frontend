import { h, icon } from '../dom/h.js';
import { button } from './button.js';
import { composer, messageList, NAMES } from './thread.js';

/** The conversations the player can open here: one per friend, when direct messages are on. The clan chat lives on the Clan tab's home screen, not here. */
export function conversationsOf(config, data) {
  const chat = config?.chat ?? {};
  if (chat.enabled !== true || chat.directMessages !== true) return [];
  return (data.friends ?? []).map((friend) => ({ id: friend.id, title: friend.name, subtitle: friend.status, messages: data.threads?.[friend.id] ?? [] }));
}

/** Chat: direct messages. Pick a friend, read the conversation, and write in it. A back button returns to where the player came from. */
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
        text: conversation.title,
        attrs: { type: 'button', 'aria-pressed': conversation.id === current?.id },
        on: { click: () => act.selectConversation(conversation.id) },
      }),
    ),
  );

  if (!current) {
    return [chips, h('div', { class: 'sk-hint', text: 'No conversations yet.' })];
  }

  return [
    chips,
    h('div', { class: 'sk-bar sk-bar-divided' }, [
      showBack ? button({ variant: 'icon', onClick: act.goBack, attrs: { 'aria-label': `Back to ${tabNames[ui.backTo]}` }, children: [icon('back', 16)] }) : null,
      h('span', { class: 'sk-row-main' }, [h('span', { class: 'sk-card-title', text: current.title }), h('span', { class: 'sk-label', text: current.subtitle })]),
    ]),
    messageList({
      config,
      messages: current.messages,
      names: NAMES.NONE,
      label: current.title,
    }),
    composer({ config, L, ui, act, conversation: current.id }),
  ];
}
