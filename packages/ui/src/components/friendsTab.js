import { friendClanName } from '../data/format.js';
import { h, icon } from '../dom/h.js';
import { avatar } from './avatar.js';
import { button } from './button.js';

const FRIEND_CONFIRMS = {
  remove: { title: (name) => `Remove ${name} from your friends?`, hint: 'You will no longer be friends. Either of you can send a new request later.', button: 'Remove' },
  block: { title: (name) => `Block ${name}?`, hint: 'You will no longer be friends, and they cannot send you requests. You can unblock them later.', button: 'Block' },
};

/** The "remove or block this friend?" confirmation: an alert dialog, like the kick and leave confirmations. */
function friendConfirm({ friend, action, act }) {
  const texts = FRIEND_CONFIRMS[action];
  return h('div', { class: 'sk-confirm', attrs: { role: 'alertdialog', 'aria-label': `${texts.button} ${friend.name}` } }, [
    h('span', { class: 'sk-confirm-title', text: texts.title(friend.name) }),
    h('span', { class: 'sk-hint', text: texts.hint }),
    h('div', { class: 'sk-actions' }, [
      button({ text: 'Cancel', variant: 'ghost', size: 'lg', fill: true, onClick: act.cancelFriendAction }),
      button({ text: texts.button, variant: 'danger', size: 'lg', fill: true, onClick: () => act[action === 'block' ? 'blockFriend' : 'removeFriend'](friend.id) }),
    ]),
  ]);
}

/** What the player can do to the selected friend: remove or block them (each after a confirmation). */
function managePanel({ friend, ui, act }) {
  const pending = ui.confirmFriend?.id === friend.id ? ui.confirmFriend.action : null;
  return h('div', { class: 'sk-member-panel', attrs: { role: 'group', 'aria-label': `Manage ${friend.name}` } }, [
    pending
      ? friendConfirm({ friend, action: pending, act })
      : h('div', { class: 'sk-actions sk-actions-wrap' }, [
          button({ text: 'Remove friend', variant: 'ghost', fill: true, strong: true, onClick: () => act.askFriendAction(friend.id, 'remove') }),
          button({ text: 'Block', variant: 'danger', fill: true, onClick: () => act.askFriendAction(friend.id, 'block') }),
        ]),
  ]);
}

/**
 * The Blocked drop-down: closed by default. Opened, it lists the players the viewer blocked; pressing one
 * unblocks them (the host does it and the list updates). An unblocked player does not become a friend again.
 * With nobody blocked there is no section at all: an empty drop-down to open is noise.
 */
function blockedSection({ blocked, ui, act }) {
  if (blocked.length === 0) return [];
  const isOpen = ui.blockedOpen === true;
  return [
    h(
      'button',
      {
        class: 'sk-collapse',
        attrs: { type: 'button', 'aria-expanded': isOpen, 'aria-controls': 'sk-blocked-list', 'data-key': 'blocked-toggle' },
        on: { click: act.toggleBlocked },
      },
      [h('span', { text: `Blocked · ${blocked.length}` }), icon('chevronDown', 14)],
    ),
    isOpen
      ? h(
          'div',
          { class: 'sk-blocked-list', attrs: { id: 'sk-blocked-list' } },
          blocked.map((player) =>
            h(
              'button',
              {
                class: 'sk-row sk-row-compact sk-row-button',
                attrs: { type: 'button', 'aria-label': `Unblock ${player.name}`, 'data-key': `blocked-${player.id}` },
                on: { click: () => act.unblock(player.id) },
              },
              [avatar(player.name), h('span', { class: 'sk-name sk-row-main', text: player.name }), h('span', { class: 'sk-tag', text: 'Unblock' })],
            ),
          ),
        )
      : null,
  ];
}

/**
 * The button on the right of a player found by the search: Add friend, or Cancel once a request is out.
 * It keeps its `data-key` when the label swaps, so the focus stays on it after the host updates the player.
 */
function playerAction({ player, act }) {
  const key = { 'data-key': `player-${player.id}` };
  if (player.relation === 'request_sent') {
    return button({
      text: 'Cancel',
      variant: 'ghost',
      strong: true,
      attrs: { ...key, 'aria-label': `Cancel friend request to ${player.name}` },
      onClick: () => act.cancelFriendRequest(player.id, player.requestId),
    });
  }
  return button({ attrs: { ...key, 'aria-label': `Add ${player.name} as a friend` }, onClick: () => act.addFriend(player.id), children: [icon('plus', 14), 'Add friend'] });
}

/**
 * Friends: search, incoming requests (Accept or Decline), the friend list with online state, and Chat when direct messages are on, then the Blocked drop-down.
 * Clicking a friend (the avatar and name) opens a small panel with Remove friend and Block; the host does the work.
 * Typing in the search also lists the players the host found who are not friends yet, each with Add friend on the
 * right; once the host marks the request as sent the button reads Cancel, and Cancel takes it back.
 */
export function friendsTab({ config, L, data, ui, act }) {
  const friends = data.friends ?? [];
  const requests = data.requests ?? [];
  const blocked = data.blocked ?? [];
  const canChat = config?.chat?.enabled === true && config?.chat?.directMessages === true;

  const rows = friends.map((friend) => {
    const isOpen = ui.selectedFriend === friend.id;
    return {
      haystack: String(friend.name ?? '').toLowerCase(),
      // The Chat button sits beside the select button, not inside it: a button cannot hold a button.
      row: h('div', { class: 'sk-friend' }, [
        h('div', { class: 'sk-friend-row' }, [
          h(
            'button',
            {
              class: 'sk-friend-select',
              attrs: { type: 'button', 'aria-expanded': isOpen, 'data-key': `friend-${friend.id}`, 'aria-label': `${friend.name}. Manage` },
              on: { click: () => act.selectFriend(isOpen ? null : friend.id) },
            },
            [
              avatar(friend.name, friend.online),
              // Under the name: the friend's clan (online or offline is the dot on the picture).
              h('span', { class: 'sk-row-main' }, [h('span', { class: 'sk-friend-name', text: friend.name }), friendClanName(friend) ? h('span', { class: 'sk-desc', text: friendClanName(friend) }) : null]),
            ],
          ),
          // A small chat icon, not a text button on every row: the list stays calm, and the label is its accessible name.
          canChat
            ? button({ variant: 'icon', attrs: { 'aria-label': `${L.chatBtn} · ${friend.name}` }, onClick: () => act.openChat(friend.id), children: [icon('chat', 16)] })
            : null,
        ]),
        isOpen ? managePanel({ friend, ui, act }) : null,
      ]),
    };
  });

  // Players the search can find who are not friends yet (the host's search results, `relation` as the social service says it).
  // Friends and blocked players have their own lists, and a request they sent is answered in the requests above.
  const listed = new Set([...friends, ...blocked].map((player) => player.id));
  const playerRows = (data.players ?? [])
    .filter((player) => (player.relation ?? 'none') === 'none' || player.relation === 'request_sent')
    .filter((player) => !listed.has(player.id) && player.id !== data.player?.id)
    .map((player) => ({
      haystack: String(player.name ?? '').toLowerCase(),
      row: h('div', { class: 'sk-friend-row sk-player' }, [
        avatar(player.name),
        h('span', { class: 'sk-row-main' }, [h('span', { class: 'sk-friend-name', text: player.name })]),
        playerAction({ player, act }),
      ]),
    }));
  const playersSection = h('div', { class: 'sk-section', text: 'Players' });

  // Searching hides rows instead of repainting, so the box keeps focus and the caret.
  // Players who are not friends show only while the player types, under their own heading.
  const applyFilter = () => {
    const query = ui.playerQuery.trim().toLowerCase();
    rows.forEach(({ row, haystack }) => {
      row.hidden = query !== '' && !haystack.includes(query);
    });
    playerRows.forEach(({ row, haystack }) => {
      row.hidden = query === '' || !haystack.includes(query);
    });
    playersSection.hidden = playerRows.every(({ row }) => row.hidden);
  };
  const search = h('input', {
    class: 'sk-input',
    attrs: { type: 'search', placeholder: L.searchPlayers, 'aria-label': L.searchPlayers, 'data-key': 'player-search', autocomplete: 'off' },
    on: {
      input: (event) => {
        ui.playerQuery = event.target.value;
        applyFilter();
        act.searchPlayers(ui.playerQuery.trim());
      },
    },
  });
  search.value = ui.playerQuery;
  applyFilter();

  return [
    search,
    ...requests.map((request) =>
      // One row, like a friend's: picture and name on the left, Accept and Decline side by side on the right.
      h('div', { class: 'sk-row sk-request' }, [
        avatar(request.name),
        h('span', { class: 'sk-row-main' }, [h('span', { class: 'sk-friend-name', text: request.name }), h('span', { class: 'sk-desc', text: 'Friend request' })]),
        h('div', { class: 'sk-request-actions' }, [
          button({ text: L.accept, variant: 'accept', attrs: { 'aria-label': `${L.accept} · ${request.name}` }, onClick: () => act.acceptRequest(request.id) }),
          button({ text: 'Decline', variant: 'decline', attrs: { 'aria-label': `Decline · ${request.name}` }, onClick: () => act.declineRequest(request.id) }),
        ]),
      ]),
    ),
    h('div', { class: 'sk-section', text: `${L.tabFriends} · ${friends.length}` }),
    ...rows.map(({ row }) => row),
    playersSection,
    ...playerRows.map(({ row }) => row),
    ...blockedSection({ blocked, ui, act }),
  ];
}
