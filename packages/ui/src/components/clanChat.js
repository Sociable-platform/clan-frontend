import { newLineIndex } from '../data/unread.js';
import { h } from '../dom/h.js';
import { composer, messageList, NAMES } from './thread.js';

/** The clan's chat on the home screen: the thread, then the message box with the game's limits. */
export function clanChat({ config, L, data, ui, act }) {
  const chat = config?.chat ?? {};
  if (chat.enabled !== true || chat.clanChat !== true) {
    return [h('div', { class: 'sk-hint', text: L.clanChatOff })];
  }

  return [
    messageList({
      config,
      L,
      messages: data.messages,
      names: NAMES.ALL,
      label: data.clan?.name,
      newFrom: newLineIndex(ui.newMessages, 'clan', data.messages),
    }),
    composer({ config, L, ui, act, conversation: 'clan' }),
  ];
}
