import { formatMessageTime, messageTime } from '../data/format.js';
import { maxMessageLength } from '../data/limits.js';
import { h } from '../dom/h.js';
import { button } from './button.js';

/**
 * Which senders get a name: everyone, only other players, or nobody. Bubbles show a small name line
 * above the first bubble of each group; the log layout always writes `Name: text`.
 */
export const NAMES = { ALL: 'all', OTHERS: 'others', NONE: 'none' };

/** Messages from the same player this close together form one group in the bubble layout. */
const GROUP_GAP_MS = 5 * 60 * 1000;

/** A message's time as a `<time>` element, or null when the host sent no time. */
function timeTag(message, className) {
  const date = messageTime(message);
  return date ? h('time', { class: className, text: formatMessageTime(date), attrs: { datetime: date.toISOString() } }) : null;
}

/** Whether `next` continues the group `previous` started: same sender, and written within a few minutes of it. */
function continuesGroup(previous, next) {
  if (!previous || previous.from !== next.from || (previous.mine === true) !== (next.mine === true)) return false;
  const before = messageTime(previous);
  const after = messageTime(next);
  return !before || !after || after.getTime() - before.getTime() <= GROUP_GAP_MS;
}

/** One bubble. The name goes above the first bubble of a group, and the time under the last one. */
function bubble(message, names, { first, last }) {
  const showName = first && (names === NAMES.ALL || (names === NAMES.OTHERS && message.mine !== true));
  return h('div', { class: 'sk-msg', attrs: { 'data-mine': message.mine === true, 'data-group-start': first } }, [
    showName ? h('span', { class: 'sk-small', text: message.from }) : null,
    h('span', { class: 'sk-bubble', text: message.body }),
    last ? timeTag(message, 'sk-msg-time') : null,
  ]);
}

/** One log line: the time, the sender (on every line), the text. */
function logLine(message, tagPrefix) {
  const time = timeTag(message, 'sk-log-time');
  return h('div', { class: 'sk-log', attrs: { 'data-mine': message.mine === true } }, [
    time,
    time ? ' ' : null,
    h('span', { class: 'sk-log-name', text: `${tagPrefix}${message.from}` }),
    `: ${message.body}`,
  ]);
}

/** The "New messages" line drawn above the first message the player had not read when they opened the conversation. */
function newMessagesLine() {
  return h('div', { class: 'sk-new-line', attrs: { role: 'separator', 'data-key': 'new-messages' } }, [h('span', { text: 'New messages' })]);
}

/**
 * A conversation's messages, as bubbles or as a log, depending on `chat.layout`. `newFrom` is the index of
 * the first unread message, when the conversation was opened with some: a "New messages" line goes above it.
 * Bubbles are grouped: a player's messages in a row (within a few minutes of each other) show their name once,
 * above the first, and the time once, under the last. The "New messages" line starts a new group. A log
 * line always has the time and the name. A message's time is its `at` (an ISO date or epoch milliseconds).
 */
export function messageList({ config, messages, names, tagPrefix = '', label, newFrom = null }) {
  const asLog = config?.chat?.layout === 'log';
  const list = messages ?? [];
  const hasNewLine = Number.isInteger(newFrom) && newFrom >= 0 && newFrom < list.length;
  const startsGroup = (index) => index === 0 || (hasNewLine && index === newFrom) || !continuesGroup(list[index - 1], list[index]);
  const lines = list.map((message, index) =>
    asLog ? logLine(message, tagPrefix) : bubble(message, names, { first: startsGroup(index), last: index === list.length - 1 || startsGroup(index + 1) }),
  );
  if (hasNewLine) lines.splice(newFrom, 0, newMessagesLine());
  return h('div', { class: 'sk-chat', attrs: { role: 'log', 'aria-label': label, 'data-key': 'chat' } }, lines);
}

/** The counter shows from this share of the length limit on (240 of 300): far from the limit it is noise. */
const COUNTER_FROM = 0.8;

/**
 * The message box with the game's length limit and a counter that appears only near the limit. Slow mode is not shown: the server
 * enforces it, and a player does not need the setting spelled out. `conversation` names where the
 * text goes ('clan' or a friend's id) and is handed to the host with the text.
 */
export function composer({ config, L, ui, act, conversation }) {
  const maxLength = maxMessageLength(config);
  const counter = h('span', { text: `${ui.draft.length} / ${maxLength}` });
  const meta = h('div', { class: 'sk-meta' }, [counter]);
  const showCounter = () => {
    counter.textContent = `${ui.draft.length} / ${maxLength}`;
    meta.hidden = ui.draft.length < Math.ceil(maxLength * COUNTER_FROM);
  };
  showCounter();

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
        showCounter();
      },
      keydown: (event) => {
        if (event.key === 'Enter') submit();
      },
    },
  });
  input.value = ui.draft;

  return h('div', { class: 'sk-spacer' }, [
    h('div', { class: 'sk-composer' }, [input, button({ text: L.send, size: 'md', onClick: submit })]),
    meta,
  ]);
}
