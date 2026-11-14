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

/** Home: the compact clan header above the clan chat. Closed it shows only the clan name; open it adds the member count under the name, the description, View members and Leave. */
export function homeScreen(ctx) {
  const { config, L, data, ui, act } = ctx;
  const clan = data.clan;
  const max = maxMembers(config);
  const showTag = config?.clan?.tags === true && clan.tag;
  const showCount = ui.infoOpen && config?.clan?.screens?.home?.showStats !== false;

  const chevron = icon('chevronDown');
  chevron.classList.add('sk-chevron');
  chevron.setAttribute('data-open', String(ui.infoOpen));
  const toggle = button({
    variant: 'plain',
    onClick: act.toggleInfo,
    attrs: { 'aria-expanded': ui.infoOpen, 'aria-label': ui.infoOpen ? 'Hide clan info' : 'Show clan info' },
    children: [L.info, chevron],
  });

  const header = h('div', { class: 'sk-card' }, [
    h('div', { class: 'sk-card-head' }, [
      badgeTile(badgeFor(config, clan.badge, String(clan.name ?? '?').slice(0, 1).toUpperCase()), { small: true, assets: ctx.assets }),
      h('span', { class: 'sk-row-main' }, [
        h('span', { class: 'sk-card-title' }, [`${clan.name} `, showTag ? h('span', { class: 'sk-tag', text: `[${clan.tag}]` }) : null]),
        showCount ? h('span', { class: 'sk-label', text: `${countLabel(clan.memberCount, max)} members` }) : null,
      ]),
      toggle,
    ]),
    ...(ui.infoOpen ? details({ config, L, ui, act, clan }) : []),
  ]);

  return [header, ...clanChat(ctx)];
}
