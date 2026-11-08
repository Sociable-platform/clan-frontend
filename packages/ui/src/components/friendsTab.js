import { initialsOf } from '../data/format.js';
import { h } from '../dom/h.js';
import { button } from './button.js';

function avatar(name, online) {
  return h('span', { class: 'sk-avatar sk-avatar-lg', attrs: { 'aria-hidden': 'true' } }, [
    initialsOf(name),
    online === undefined ? null : h('span', { class: 'sk-presence', attrs: { 'data-online': online === true } }),
  ]);
}

/** Friends: search, incoming requests, the friend list with online state, and Chat when direct messages are on. */
export function friendsTab({ config, L, data, ui, act }) {
  const friends = data.friends ?? [];
  const requests = data.requests ?? [];
  const canChat = config?.chat?.enabled === true && config?.chat?.directMessages === true;

  const rows = friends.map((friend) => ({
    haystack: String(friend.name ?? '').toLowerCase(),
    row: h('div', { class: 'sk-friend' }, [
      avatar(friend.name, friend.online),
      h('span', { class: 'sk-row-main' }, [h('span', { class: 'sk-friend-name', text: friend.name }), h('span', { class: 'sk-desc', text: friend.status })]),
      canChat
        ? button({ text: L.chatBtn, variant: 'ghost', strong: true, attrs: { 'aria-label': `${L.chatBtn} · ${friend.name}` }, onClick: () => act.openChat(friend.id) })
        : null,
    ]),
  }));

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
