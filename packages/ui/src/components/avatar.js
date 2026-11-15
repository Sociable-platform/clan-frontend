import { initialsOf } from '../data/format.js';
import { h } from '../dom/h.js';

/** A player's round initials, with an online dot when `online` is known (true or false). Decorative: the name is always written next to it. */
export function avatar(name, online) {
  return h('span', { class: 'sk-avatar sk-avatar-lg', attrs: { 'aria-hidden': 'true' } }, [
    initialsOf(name),
    online === undefined ? null : h('span', { class: 'sk-presence', attrs: { 'data-online': online === true } }),
  ]);
}
