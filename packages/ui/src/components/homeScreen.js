import { badgeFor } from '../data/badges.js';
import { countLabel, formatDate } from '../data/format.js';
import { maxMembers } from '../data/limits.js';
import { normalizeRoles } from '../data/roles.js';
import { h, icon } from '../dom/h.js';
import { badgeTile } from './badge.js';
import { button } from './button.js';
import { clanChat } from './clanChat.js';
import { leaveConfirm } from './leaveConfirm.js';


function stat(value, label) {
  return h('div', { class: 'sk-stat' }, [h('span', { class: 'sk-stat-value', text: value }), h('span', { class: 'sk-small', text: label })]);
}

function details({ config, L, clan, ui, act, max }) {
  const showStats = config?.clan?.screens?.home?.showStats !== false;
  const canListMembers = config?.clan?.screens?.members?.enabled !== false;
  const created = formatDate(clan.createdAt);

  return [
    h('div', { class: 'sk-card-text', text: clan.description }),
    showStats
      ? h('div', { class: 'sk-stats' }, [
          stat(countLabel(clan.memberCount, max), 'Members'),
          stat(String(clan.level ?? ''), 'Level'),
          stat(String(clan.weeklyXp ?? ''), 'Weekly XP'),
        ])
      : null,
    h('div', { class: 'sk-actions' }, [
      canListMembers ? button({ text: L.viewMembers, variant: 'ghost', size: 'lg', fill: true, onClick: () => act.navigate('members') }) : null,
      button({ variant: 'ghost', onClick: act.askLeave, attrs: { 'aria-label': L.leave }, children: [icon('leave'), L.leaveShort] }),
    ]),
    ui.confirmLeave ? leaveConfirm({ L, clan, act }) : null,
    h('span', { class: 'sk-small', text: `${normalizeRoles(config).at(-1).name} ${clan.ownerName ?? ''}${created ? ` · created ${created}` : ''}` }),
  ];
}

/** Home: the compact clan header (with info, stats and leave) above the clan chat. */
export function homeScreen(ctx) {
  const { config, L, data, ui, act } = ctx;
  const clan = data.clan;
  const max = maxMembers(config);
  const showTag = config?.clan?.tags === true && clan.tag;

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
        h('span', { class: 'sk-label', text: `${countLabel(clan.memberCount, max)} · Lv ${clan.level ?? '?'} · Open` }),
      ]),
      toggle,
    ]),
    ...(ui.infoOpen ? details({ config, L, clan, ui, act, max }) : []),
  ]);

  return [header, ...clanChat(ctx)];
}
