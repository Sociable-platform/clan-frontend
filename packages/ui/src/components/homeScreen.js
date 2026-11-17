import { badgeFor } from '../data/badges.js';
import { countLabel } from '../data/format.js';
import { maxMembers } from '../data/limits.js';
import { h, icon } from '../dom/h.js';
import { badgeTile } from './badge.js';
import { button } from './button.js';
import { clanChat } from './clanChat.js';
import { leaveConfirm } from './leaveConfirm.js';

function details({ config, L, ui, act, clan }) {
  const canListMembers = config?.clan?.screens?.members?.enabled !== false;

  return [
    h('div', { class: 'sk-card-text', text: clan.description }),
    h('div', { class: 'sk-actions' }, [
      canListMembers ? button({ text: L.viewMembers, variant: 'ghost', onClick: () => act.navigate('members') }) : null,
      button({ variant: 'ghost', onClick: act.askLeave, attrs: { 'aria-label': L.leave }, children: [icon('leave'), L.leaveShort] }),
    ]),
    ui.confirmLeave ? leaveConfirm({ L, clan, act }) : null,
  ];
}

/**
 * A leader of a closed clan sees, under the header, that players asked to join, and one tap opens them (they are answered on
 * Members). The host sends the requests only to the leaders who may decide. Nothing when there are none, or when the game has
 * switched the Members screen off.
 */
function requestsNotice({ config, data, act }) {
  const count = (data.clanRequests ?? []).length;
  if (count === 0 || config?.clan?.screens?.members?.enabled === false) return null;
  const text = count === 1 ? '1 player wants to join' : `${count} players want to join`;
  return h('button', { class: 'sk-card sk-requests-notice', attrs: { type: 'button', 'data-key': 'requests-notice', 'aria-label': `${text}. Review the requests` }, on: { click: () => act.navigate('members') } }, [
    h('span', { class: 'sk-row-main', text }),
    h('span', { class: 'sk-requests-action', text: 'Review', attrs: { 'aria-hidden': 'true' } }),
  ]);
}

/**
 * Home: the compact clan header above the clan chat. Closed it shows only the clan name; open it adds the
 * member count under the name, the description, View members and Leave. The whole header row (badge, name
 * and the arrow) is one button that opens and closes the info, so the player can tap anywhere on it.
 */
export function homeScreen(ctx) {
  const { config, L, data, ui, act } = ctx;
  const clan = data.clan;
  const max = maxMembers(config);
  const showCount = ui.infoOpen && config?.clan?.screens?.home?.showStats !== false;

  const chevron = icon('chevronDown');
  chevron.classList.add('sk-chevron');
  chevron.setAttribute('data-open', String(ui.infoOpen));
  // Nothing else in the row is clickable, so the row itself can be the button (a button cannot hold another one).
  const toggle = h(
    'button',
    {
      class: 'sk-card-head sk-card-toggle',
      attrs: { type: 'button', 'aria-expanded': ui.infoOpen, 'aria-label': `${clan.name}. ${ui.infoOpen ? 'Hide' : 'Show'} clan info`, 'data-key': 'clan-info' },
      on: { click: act.toggleInfo },
    },
    [
      badgeTile(badgeFor(config, clan.badge, String(clan.name ?? '?').slice(0, 1).toUpperCase()), { small: true, assets: ctx.assets }),
      h('span', { class: 'sk-row-main' }, [
        h('span', { class: 'sk-card-title', text: clan.name }),
        showCount ? h('span', { class: 'sk-label', text: `${countLabel(clan.memberCount, max)} members` }) : null,
      ]),
      // Only the arrow shows the row opens; the button's accessible name says what it does.
      h('span', { class: 'sk-info-hint', attrs: { 'aria-hidden': 'true' } }, [chevron]),
    ],
  );

  const header = h('div', { class: 'sk-card' }, [toggle, ...(ui.infoOpen ? details({ config, L, ui, act, clan }) : [])]);

  return [header, requestsNotice({ config, data, act }), ...clanChat(ctx)];
}
