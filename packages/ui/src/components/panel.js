import { enabledTabs } from '../data/screens.js';
import { h } from '../dom/h.js';
import { button } from './button.js';
import { chatTab } from './chatTab.js';
import { createScreen } from './createScreen.js';
import { discoverScreen } from './discoverScreen.js';
import { friendsTab } from './friendsTab.js';
import { homeScreen } from './homeScreen.js';
import { membersScreen } from './membersScreen.js';

const SCREEN_VIEWS = { discover: discoverScreen, create: createScreen, home: homeScreen, members: membersScreen };

function tabBar({ config, L, tabs, activeTab, act }) {
  const labels = { friends: L.tabFriends, clan: L.tabClan, chat: L.tabChat };
  return h(
    'div',
    { class: 'sk-tabs', attrs: { role: 'tablist' } },
    tabs.map((tab) =>
      h('button', {
        class: 'sk-tab',
        text: labels[tab],
        attrs: { type: 'button', role: 'tab', 'aria-selected': tab === activeTab },
        on: { click: () => act.setTab(tab) },
      }),
    ),
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
    tabs.length > 0 ? tabBar({ config, L, tabs, activeTab, act }) : null,
    content,
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
