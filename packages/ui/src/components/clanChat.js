import { h } from '../dom/h.js';
import { composer, messageList, NAMES } from './thread.js';

/** The tag shown before a player's name in the log layout, when the game uses clan tags. */
export const clanTagPrefix = (config, clan) => (config?.clan?.tags === true && clan?.tag ? `[${clan.tag}] ` : '');

/** The clan's chat on the home screen: the thread, then the message box with the game's limits. */
export function clanChat({ config, L, data, ui, act }) {
  const chat = config?.chat ?? {};
  if (chat.enabled !== true || chat.clanChat !== true) {
    return [h('div', { class: 'sk-hint', text: L.clanChatOff })];
  }

  return [
    messageList({ config, messages: data.messages, names: NAMES.ALL, tagPrefix: clanTagPrefix(config, data.clan), label: data.clan?.name }),
    composer({ config, L, ui, act, conversation: 'clan' }),
  ];
}
