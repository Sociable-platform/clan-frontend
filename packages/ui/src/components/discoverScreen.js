import { badgeFor } from '../data/badges.js';
import { countLabel } from '../data/format.js';
import { maxMembers } from '../data/limits.js';
import { h } from '../dom/h.js';
import { badgeTile } from './badge.js';
import { button } from './button.js';


/** Discover: search the open clans and join one, or go to create. */
export function discoverScreen({ config, L, data, ui, act, assets }) {
  const max = maxMembers(config);
  const showTags = config?.clan?.tags === true;

  const entries = (data.clans ?? []).map((clan) => {
    const full = clan.memberCount >= max;
    const row = h('div', { class: 'sk-row' }, [
      badgeTile(badgeFor(config, clan.badge, String(clan.name ?? '?').slice(0, 1).toUpperCase()), { assets }),
      h('span', { class: 'sk-row-main' }, [
        h('span', { class: 'sk-name' }, [`${clan.name} `, showTags && clan.tag ? h('span', { class: 'sk-tag', text: `[${clan.tag}]` }) : null]),
        h('span', { class: 'sk-desc', text: clan.description }),
        h('span', { class: 'sk-small', text: `${countLabel(clan.memberCount, max)} members` }),
      ]),
      button({ text: full ? L.full : L.join, disabled: full, onClick: () => act.join(clan.id) }),
    ]);
    return { row, haystack: `${clan.name} ${clan.tag ?? ''}`.toLowerCase() };
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

  const canCreate = config?.clan?.screens?.create?.enabled !== false;
  return [
    search,
    ...entries.map(({ row }) => row),
    canCreate ? button({ text: L.createCta, variant: 'dashed', onClick: () => act.navigate('create') }) : null,
  ];
}
