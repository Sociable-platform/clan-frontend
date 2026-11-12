import { initialsOf } from '../data/format.js';
import { h } from '../dom/h.js';
import { button } from './button.js';

function avatar(name, online) {
  return h('span', { class: 'sk-avatar sk-avatar-lg', attrs: { 'aria-hidden': 'true' } }, [
    initialsOf(name),
    online === undefined ? null : h('span', { class: 'sk-presence', attrs: { 'data-online': online === true } }),
  ]);
}

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
 * Friends: search, incoming requests, the friend list with online state, and Chat when direct messages are on.
 * Clicking a friend (the avatar and name) opens a small panel with Remove friend and Block; the host does the work.
 */
export function friendsTab({ config, L, data, ui, act }) {
  const friends = data.friends ?? [];
  const requests = data.requests ?? [];
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
              h('span', { class: 'sk-row-main' }, [h('span', { class: 'sk-friend-name', text: friend.name }), h('span', { class: 'sk-desc', text: friend.status })]),
            ],
          ),
          canChat
            ? button({ text: L.chatBtn, variant: 'ghost', strong: true, attrs: { 'aria-label': `${L.chatBtn} · ${friend.name}` }, onClick: () => act.openChat(friend.id) })
            : null,
        ]),
        isOpen ? managePanel({ friend, ui, act }) : null,
      ]),
    };
  });

  // Searching hides rows instead of repainting, so the box keeps focus and the caret.
  const applyFilter = () => {
    const query = ui.playerQuery.trim().toLowerCase();
    rows.forEach(({ row, haystack }) => {
      row.hidden = query !== '' && !haystack.includes(query);
    });
  };
  const search = h('input', {
    class: 'sk-input',
    attrs: { type: 'search', placeholder: L.searchPlayers, 'aria-label': L.searchPlayers, 'data-key': 'player-search', autocomplete: 'off' },
    on: {
      input: (event) => {
        ui.playerQuery = event.target.value;
        applyFilter();
      },
    },
  });
  search.value = ui.playerQuery;
  applyFilter();

  return [
    search,
    ...requests.map((request) =>
      h('div', { class: 'sk-row' }, [
        avatar(request.name),
        h('span', { class: 'sk-row-main sk-friend-request' }, [h('span', { class: 'sk-friend-name', text: request.name }), ' sent a request']),
        button({ text: L.accept, onClick: () => act.acceptRequest(request.id), attrs: { 'aria-label': `${L.accept} · ${request.name}` } }),
      ]),
    ),
    h('div', { class: 'sk-section', text: `${L.tabFriends} · ${friends.length}` }),
    ...rows.map(({ row }) => row),
  ];
}
