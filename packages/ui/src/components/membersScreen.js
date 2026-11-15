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

/** A friendship that is already settled (or waiting), shown as a state rather than a button: a check, the words, and an optional small action on the right. */
function friendState(text, action = null) {
  return h('div', { class: 'sk-friend-state' }, [icon('check'), h('span', { class: 'sk-row-main', text }), action]);
}

/**
 * The first line of the member panel, always in the same place: Add friend, Accept when they asked first,
 * "Friend request sent" with a small Undo once one is out, or "Friends". Nothing for a blocked player.
 */
function friendLine({ member, relation, act }) {
  if (relation === 'blocked') return null;
  if (relation === 'friend') return friendState('Friends');
  // Undo sits away from where Add friend was, so a quick second tap does not take the request back.
  if (relation === 'request_sent') {
    return friendState('Friend request sent', button({ text: 'Undo', variant: 'plain', attrs: { 'aria-label': `Cancel friend request to ${member.name}` }, onClick: () => act.cancelFriendRequest(member.id, member.requestId) }));
  }
  // A pending request from them is accepted by sending one back (the server makes them friends).
  if (relation === 'request_received') {
    return button({ text: 'Accept friend request', fill: true, attrs: { 'aria-label': `Accept friend request from ${member.name}` }, onClick: () => act.addFriend(member.id) });
  }
  return button({ fill: true, attrs: { 'aria-label': `Add ${member.name} as a friend` }, onClick: () => act.addFriend(member.id), children: [icon('plus'), 'Add friend'] });
}

/**
 * The second line, only when the viewer's role lets them manage this member: promote and demote name the
 * role they lead to, and Kick stands apart on the right in red (it still asks first).
 */
function roleLine({ member, abilities, act }) {
  if (!hasAbilities(abilities)) return null;
  const { promoteTo, demoteTo, canKick } = abilities;
  return h('div', { class: 'sk-member-roles' }, [
    promoteTo
      ? button({ variant: 'ghost', strong: true, fill: true, attrs: { 'aria-label': `Promote to ${promoteTo.name}` }, onClick: () => act.setRole(member.id, promoteTo.id), children: [icon('chevronUp'), promoteTo.name] })
      : null,
    demoteTo
      ? button({ variant: 'ghost', strong: true, fill: true, attrs: { 'aria-label': `Demote to ${demoteTo.name}` }, onClick: () => act.setRole(member.id, demoteTo.id), children: [icon('chevronDown'), demoteTo.name] })
      : null,
    canKick ? button({ text: 'Kick', variant: 'danger-text', onClick: () => act.askKick(member.id) }) : null,
  ]);
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

/** What the viewer can do to the selected member: the friend line, then the role line when the viewer's role allows it. */
function managePanel({ L, member, abilities, relation, clan, ui, act }) {
  const pending = ui.confirmKick === member.id;
  const lines = pending ? [kickConfirm({ L, member, clan, act })] : [friendLine({ member, relation, act }), roleLine({ member, abilities, act })];
  return h('div', { class: 'sk-member-panel', attrs: { role: 'group', 'aria-label': hasAbilities(abilities) ? `Manage ${member.name}` : `Options for ${member.name}` } }, lines);
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
