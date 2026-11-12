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

/**
 * How the viewer stands with a member: `none`, `friend`, `request_sent`, `request_received` or `blocked` (the
 * social service's words). The host may say it on the member (`relation`); otherwise the panel reads it from
 * the friends and blocked lists, whose ids are the same player ids.
 */
function relationOf(member, data) {
  if (member.relation) return member.relation;
  if ((data.blocked ?? []).some((player) => player.id === member.id)) return 'blocked';
  if ((data.friends ?? []).some((friend) => friend.id === member.id)) return 'friend';
  return 'none';
}

/** The friend part of the member panel: Add friend, Cancel friend request once one is sent, or what the relation already is. Nothing for a blocked player. */
function friendOffer({ member, relation, act }) {
  if (relation === 'friend') return h('span', { class: 'sk-hint', text: `You and ${member.name} are friends` });
  // After Add friend the button turns into Cancel, which takes the request back (its accessible name says what it cancels).
  if (relation === 'request_sent') {
    return button({ text: 'Cancel', variant: 'ghost', fill: true, strong: true, attrs: { 'aria-label': `Cancel friend request to ${member.name}` }, onClick: () => act.cancelFriendRequest(member.id, member.requestId) });
  }
  if (relation === 'blocked') return null;
  // A pending request from them is accepted by sending one back (the server makes them friends).
  return button({ text: 'Add friend', fill: true, attrs: { 'aria-label': `Add ${member.name} as a friend` }, onClick: () => act.addFriend(member.id) });
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

/** What the viewer can do to the selected member: add them as a friend, and promote, demote or kick when the role allows. */
function managePanel({ L, member, abilities, relation, clan, ui, act }) {
  const pending = ui.confirmKick === member.id;
  return h('div', { class: 'sk-member-panel', attrs: { role: 'group', 'aria-label': hasAbilities(abilities) ? `Manage ${member.name}` : `Options for ${member.name}` } }, [
    pending
      ? kickConfirm({ L, member, clan, act })
      : h('div', { class: 'sk-actions sk-actions-wrap' }, [
          friendOffer({ member, relation, act }),
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
 * Members: the roster, most powerful role first. Every member but the viewer is a button: clicking
 * it opens Add friend and, for a member the viewer may manage, promote, demote and kick (only what the
 * viewer's role allows), one member at a time. The viewer is the member whose id is `data.player.id`.
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
    // Any member but the viewer can be added as a friend, so every other member opens a panel (when the viewer is known).
    const relation = viewer && !member.isYou ? relationOf(member, data) : null;
    const canManage = hasAbilities(abilities);
    if (!canManage && (relation == null || relation === 'blocked')) return h('div', { class: 'sk-row sk-row-compact' }, memberLine(member, roles));

    const isOpen = ui.selectedMember === member.id;
    const row = h(
      'button',
      {
        class: 'sk-row sk-row-compact sk-row-button',
        attrs: { type: 'button', 'aria-expanded': isOpen, 'data-key': `member-${member.id}`, 'aria-label': `${member.name}, ${roleName(roles, member.role)}. ${canManage ? 'Manage' : 'Options'}` },
        on: { click: () => act.selectMember(isOpen ? null : member.id) },
      },
      memberLine(member, roles),
    );
    return h('div', { class: 'sk-member' }, [row, isOpen ? managePanel({ L, member, abilities, relation, clan, ui, act }) : null]);
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
