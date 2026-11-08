import { maxMessageLength, slowModeSeconds } from '../data/limits.js';
import { h } from '../dom/h.js';
import { button } from './button.js';

/**
 * Which senders get a name: everyone, only other players, or nobody. Bubbles show a small name line
 * above the bubble; the log layout always writes `Name: text`.
 */
export const NAMES = { ALL: 'all', OTHERS: 'others', NONE: 'none' };

function bubble(message, names) {
  const showName = names === NAMES.ALL || (names === NAMES.OTHERS && message.mine !== true);
  return h('div', { class: 'sk-msg', attrs: { 'data-mine': message.mine === true } }, [
    showName ? h('span', { class: 'sk-small', text: message.from }) : null,
    h('span', { class: 'sk-bubble', text: message.body }),
  ]);
}

function logLine(message, tagPrefix) {
  return h('div', { class: 'sk-log', attrs: { 'data-mine': message.mine === true } }, [
    h('span', { class: 'sk-log-name', text: `${tagPrefix}${message.from}` }),
    `: ${message.body}`,
  ]);
}

/** A conversation's messages, as bubbles or as a log, depending on `chat.layout`. */
export function messageList({ config, messages, names, tagPrefix = '', label }) {
  const asLog = config?.chat?.layout === 'log';
  return h(
    'div',
    { class: 'sk-chat', attrs: { role: 'log', 'aria-label': label } },
    (messages ?? []).map((message) => (asLog ? logLine(message, tagPrefix) : bubble(message, names))),
  );
}

/**
 * The message box with the game's limits: length, slow mode label and a counter. `conversation`
 * names where the text goes ('clan' or a friend's id) and is handed to the host with the text.
 */
export function composer({ config, L, ui, act, conversation }) {
  const maxLength = maxMessageLength(config);
  const slow = slowModeSeconds(config);
  const counter = h('span', { text: `${ui.draft.length} / ${maxLength}` });

  const submit = () => {
    const text = ui.draft.trim();
    if (text) act.sendMessage(text, conversation);
  };
  const input = h('input', {
    class: 'sk-input',
    attrs: { type: 'text', maxlength: maxLength, placeholder: L.messagePh, 'aria-label': L.messagePh, 'data-key': 'message', autocomplete: 'off' },
    on: {
      input: (event) => {
        ui.draft = event.target.value;
        counter.textContent = `${ui.draft.length} / ${maxLength}`;
      },
      keydown: (event) => {
        if (event.key === 'Enter') submit();
      },
    },
  });
  input.value = ui.draft;

  return h('div', { class: 'sk-spacer' }, [
    h('div', { class: 'sk-composer' }, [input, button({ text: L.send, size: 'md', onClick: submit })]),
    h('div', { class: 'sk-meta' }, [h('span', { text: slow > 0 ? `Slow mode · ${slow}s` : 'Slow mode off' }), counter]),
  ]);
}
