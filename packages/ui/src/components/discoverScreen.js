import { badgeFor } from '../data/badges.js';
import { countLabel } from '../data/format.js';
import { maxMembers } from '../data/limits.js';
import { h, icon } from '../dom/h.js';
import { badgeTile } from './badge.js';
import { button } from './button.js';


/**
 * Discover: search the open clans and join one, or go to create. A player who is already in a clan opens
 * it from Home ("Find clans") to look around: they can search and read, Join is off with a hint, their own
 * clan says Joined, and there is no create button; a Back button returns to Home.
 */
export function discoverScreen({ config, L, data, ui, act, assets }) {
  const max = maxMembers(config);
  const ownClanId = data.clan?.id;
  const isInClan = data.clan != null;

  const entries = (data.clans ?? []).map((clan) => {
    const full = clan.memberCount >= max;
    const isOwn = isInClan && clan.id === ownClanId;
    // A closed clan takes a request: "Request", then "Requested" (a click takes it back) until a leader decides.
    const closed = clan.joinPolicy === 'closed';
    const requested = closed && clan.requested === true;
    const joinLabel = isOwn ? 'Joined' : full ? L.full : requested ? 'Requested' : closed ? 'Request' : L.join;
    const members = `${countLabel(clan.memberCount, max)} members`;
    const row = h('div', { class: 'sk-row' }, [
      badgeTile(badgeFor(config, clan.badge, String(clan.name ?? '?').slice(0, 1).toUpperCase()), { assets }),
      h('span', { class: 'sk-row-main' }, [
        h('span', { class: 'sk-name', text: clan.name }),
        h('span', { class: 'sk-desc', text: clan.description }),
        h('span', { class: 'sk-small', text: closed ? `${members} · Closed` : members }),
      ]),
      requested && !isInClan
        ? button({ text: joinLabel, variant: 'ghost', attrs: { 'aria-label': `Requested to join ${clan.name}. Take the request back` }, onClick: () => act.cancelJoinRequest(clan.id) })
        : button({
            text: joinLabel,
            disabled: full || isInClan,
            attrs: closed ? { 'aria-label': `Ask to join ${clan.name}` } : {},
            onClick: () => act.join(clan.id),
          }),
    ]);
    return { row, haystack: String(clan.name ?? '').toLowerCase() };
  });

  // Searching hides rows instead of repainting, so the box keeps focus and the caret.
  const applyFilter = () => {
    const query = ui.query.trim().toLowerCase();
    entries.forEach(({ row, haystack }) => {
      row.hidden = query !== '' && !haystack.includes(query);
    });
  };
  const search = h('input', {
    class: 'sk-input',
    attrs: { type: 'search', placeholder: L.searchClans, 'aria-label': L.searchClans, 'data-key': 'search', autocomplete: 'off' },
    on: {
      input: (event) => {
        ui.query = event.target.value;
        applyFilter();
      },
    },
  });
  search.value = ui.query;
  applyFilter();

  const canCreate = !isInClan && config?.clan?.screens?.create?.enabled !== false;
  const back = isInClan
    ? h('div', { class: 'sk-bar' }, [
        button({ variant: 'icon', onClick: () => act.navigate('home'), attrs: { 'aria-label': 'Back to clan' }, children: [icon('back', 16)] }),
        h('span', { class: 'sk-title', text: L.findClans }),
      ])
    : null;
  // Starting a clan sits beside the search, so it is in view however long the list of clans is.
  const create = canCreate ? button({ text: L.createCta, variant: 'ghost', size: 'md', strong: true, onClick: () => act.navigate('create') }) : null;
  return [
    back,
    create ? h('div', { class: 'sk-search-row' }, [search, create]) : search,
    isInClan ? h('div', { class: 'sk-hint', text: L.joinLeaveFirst }) : null,
    ...entries.map(({ row }) => row),
  ];
}
