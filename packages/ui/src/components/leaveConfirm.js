import { h } from '../dom/h.js';
import { button } from './button.js';

/** The "leave this clan?" confirmation. It is an alert dialog so a screen reader announces it. */
export function leaveConfirm({ L, clan, act }) {
  return h('div', { class: 'sk-confirm', attrs: { role: 'alertdialog', 'aria-label': L.leave } }, [
    h('span', { class: 'sk-confirm-title', text: `${L.leaveShort} ${clan.name}?` }),
    h('span', { class: 'sk-hint', text: L.leaveWarn }),
    h('div', { class: 'sk-actions' }, [
      button({ text: L.cancel, variant: 'ghost', size: 'lg', fill: true, onClick: act.cancelLeave }),
      button({ text: L.leave, variant: 'danger', size: 'lg', fill: true, onClick: act.leave }),
    ]),
  ]);
}
