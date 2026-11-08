import { countLabel, initialsOf } from '../data/format.js';
import { maxMembers } from '../data/limits.js';
import { abilitiesOver, hasAbilities, isTopRole, normalizeRoles, roleIndex, roleName } from '../data/roles.js';
import { h, icon } from '../dom/h.js';
import { button } from './button.js';
import { leaveConfirm } from './leaveConfirm.js';

function memberLine(member, roles) {
  return [
    h('span', { class: 'sk-avatar', text: initialsOf(member.name), attrs: { 'aria-hidden': 'true' } }),
    h('span', { class: 'sk-name sk-row-main' }, [member.name, member.isYou ? h('span', { class: 'sk-tag', text: ' (you)' }) : null]),
    h('span', { class: 'sk-role', text: roleName(roles, member.role), attrs: { 'data-top': isTopRole(roles, member.role) } }),
  ];
}

/** The "kick this member?" confirmation: an alert dialog, like the leave confirmation. */
function kickConfirm({ L, member, clan, act }) {
  return h('div', { class: 'sk-confirm', attrs: { role: 'alertdialog', 'aria-label': `Kick ${member.name}` } }, [
    h('span', { class: 'sk-confirm-title', text: `Kick ${member.name} from ${clan.name}?` }),
    h('span', { class: 'sk-hint', text: 'They can join again later if there is room.' }),
    h('div', { class: 'sk-actions' }, [
      button({ text: L.cancel, variant: 'ghost', size: 'lg', fill: true, onClick: act.cancelKick }),
      button({ text: 'Kick', variant: 'danger', size: 'lg', fill: true, onClick: () => act.kick(member.id) }),
    ]),
  ]);
}

/** What the viewer can do to the selected member: promote, demote or kick. */
function managePanel({ L, member, abilities, clan, ui, act }) {
  const pending = ui.confirmKick === member.id;
  return h('div', { class: 'sk-member-panel', attrs: { role: 'group', 'aria-label': `Manage ${member.name}` } }, [
    pending
      ? kickConfirm({ L, member, clan, act })
      : h('div', { class: 'sk-actions sk-actions-wrap' }, [
          // The button says only what it does; the role it leads to is in its accessible name (and the member's pill changes when it is pressed).
          abilities.promoteTo
            ? button({ text: 'Promote', fill: true, attrs: { 'aria-label': `Promote to ${abilities.promoteTo.name}` }, onClick: () => act.setRole(member.id, abilities.promoteTo.id) })
            : null,
          abilities.demoteTo
            ? button({ text: 'Demote', variant: 'ghost', fill: true, strong: true, attrs: { 'aria-label': `Demote to ${abilities.demoteTo.name}` }, onClick: () => act.setRole(member.id, abilities.demoteTo.id) })
            : null,
          abilities.canKick ? button({ text: 'Kick', variant: 'danger', fill: true, onClick: () => act.askKick(member.id) }) : null,
        ]),
  ]);
}

/**
 * Members: the roster, most powerful role first. A member the viewer may manage is a button: clicking
 * it opens promote, demote and kick for that member (only what the viewer's role allows), one member at
 * a time. The viewer is the member whose id is `data.player.id`.
 */
export function membersScreen({ config, L, data, ui, act }) {
  const clan = data.clan;
  const max = maxMembers(config);
  const canGoHome = config?.clan?.screens?.home?.enabled !== false;
  const roles = normalizeRoles(config);
  const viewerId = data.player?.id;
  const members = (data.members ?? [])
    .map((member, order) => ({ ...member, order, isYou: viewerId != null && member.id === viewerId }))
    .sort((a, b) => roleIndex(roles, b.role) - roleIndex(roles, a.role) || a.order - b.order);
  const viewer = members.find((member) => member.isYou);

  const back = canGoHome
    ? button({ variant: 'icon', onClick: () => act.navigate('home'), attrs: { 'aria-label': 'Back to clan' }, children: [icon('back', 16)] })
    : null;

  const rows = members.map((member) => {
    const abilities = viewer ? abilitiesOver(roles, viewer.role, member.role) : abilitiesOver(roles, null, null);
    if (!hasAbilities(abilities)) return h('div', { class: 'sk-row sk-row-compact' }, memberLine(member, roles));

    const isOpen = ui.selectedMember === member.id;
    const row = h(
      'button',
      {
        class: 'sk-row sk-row-compact sk-row-button',
        attrs: { type: 'button', 'aria-expanded': isOpen, 'data-key': `member-${member.id}`, 'aria-label': `${member.name}, ${roleName(roles, member.role)}. Manage` },
        on: { click: () => act.selectMember(isOpen ? null : member.id) },
      },
      memberLine(member, roles),
    );
    return h('div', { class: 'sk-member' }, [row, isOpen ? managePanel({ L, member, abilities, clan, ui, act }) : null]);
  });

  return [
    h('div', { class: 'sk-bar' }, [
      back,
      h('span', { class: 'sk-title', text: L.membersTitle }),
      h('span', { class: 'sk-status', text: countLabel(clan.memberCount ?? members.length, max) }),
    ]),
    ...rows,
    h('div', { class: 'sk-spacer sk-chat' }, [
      ui.confirmLeave ? leaveConfirm({ L, clan, act }) : null,
      button({ text: L.leave, variant: 'dashed', onClick: act.askLeave }),
    ]),
  ];
}
