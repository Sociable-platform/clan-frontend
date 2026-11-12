import { canFindClans, enabledTabs } from '../data/screens.js';
import { h, icon } from '../dom/h.js';
import { badgeDialog } from './badgeDialog.js';
import { button } from './button.js';
import { chatTab } from './chatTab.js';
import { createScreen } from './createScreen.js';
import { discoverScreen } from './discoverScreen.js';
import { friendsTab } from './friendsTab.js';
import { homeScreen } from './homeScreen.js';
import { membersScreen } from './membersScreen.js';

const SCREEN_VIEWS = { discover: discoverScreen, create: createScreen, home: homeScreen, members: membersScreen };

/**
 * The tab bar. For a member of a clan the Clan tab carries a small search icon on its right edge, so
 * "Clan" and "find clans" are one control: the icon is a separate button laid over the tab (a button cannot
 * sit inside a tab), and it opens the clan search from any tab, or closes it when it is already open.
 */
function tabBar({ config, L, data, tabs, activeTab, screen, act }) {
  const labels = { friends: L.tabFriends, clan: L.tabClan, chat: L.tabChat };
  const showFind = canFindClans(config, data.clan != null);
  const isFinding = activeTab === 'clan' && screen === 'discover';

  const tabButton = (tab) =>
    h('button', {
      class: 'sk-tab',
      text: labels[tab],
      attrs: { type: 'button', role: 'tab', 'aria-selected': tab === activeTab },
      on: { click: () => act.setTab(tab) },
    });

  return h(
    'div',
    { class: 'sk-tabs', attrs: { role: 'tablist' } },
    tabs.map((tab) => {
      if (tab !== 'clan' || !showFind) return tabButton(tab);
      return h('div', { class: 'sk-tab-group', attrs: { 'data-selected': activeTab === 'clan' } }, [
        tabButton(tab),
        h(
          'button',
          {
            class: 'sk-tab-search',
            attrs: { type: 'button', 'aria-label': L.findClans, 'aria-pressed': isFinding, 'data-key': 'find-clans' },
            on: { click: () => (isFinding ? act.navigate('home') : act.findClans()) },
          },
          [icon('search', 14)],
        ),
      ]);
    }),
  );
}

/**
 * The whole widget: the open panel (title, tabs, content) above the launcher button. The body is
 * the clan screen, the friends tab or the chat tab, whichever tab is active.
 */
export function panel(ctx) {
  const { config, L, data, ui, act, screen, position } = ctx;
  const tabs = enabledTabs(config);
  const activeTab = tabs.includes(ui.tab) ? ui.tab : (tabs.includes('clan') ? 'clan' : tabs[0]);
  const view = { clan: screen ? SCREEN_VIEWS[screen] : null, friends: friendsTab, chat: chatTab }[activeTab] ?? null;

  const content = h('div', { class: 'sk-content', attrs: { 'data-key': 'content' } }, view ? view(ctx).filter(Boolean) : []);
  const open = h('section', { class: 'sk-panel', attrs: { 'aria-label': L.panelTitle } }, [
    h('div', { class: 'sk-header' }, [
      h('h2', { class: 'sk-title', text: L.panelTitle }),
      h('span', { class: 'sk-online', attrs: { 'aria-hidden': 'true' } }),
      h('span', { class: 'sk-status', text: `${data.player?.name ?? 'You'} · online` }),
    ]),
    tabs.length > 0 ? tabBar({ config, L, data, tabs, activeTab, screen, act }) : null,
    content,
    // The badge popup lies over the whole panel (tabs included), not inside the scrolling content.
    ui.badgePickerOpen && activeTab === 'clan' && screen === 'create' ? badgeDialog({ config, ui, act, assets: ctx.assets }) : null,
  ]);
  open.hidden = !ui.open;

  const launcher = button({
    text: L.launcher,
    size: 'lg',
    attrs: { 'aria-expanded': ui.open },
    onClick: act.toggleOpen,
  });
  launcher.classList.add('sk-launcher');

  return h('div', { class: 'sk-dock', attrs: { 'data-position': position } }, [open, launcher]);
}
