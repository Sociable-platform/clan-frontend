import { activeTabOf, canFindClans, enabledTabs } from '../data/screens.js';
import { badgeText, unreadBadges } from '../data/unread.js';
import { h, icon } from '../dom/h.js';
import { badgeDialog } from './badgeDialog.js';
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
function tabBar({ config, L, data, ui, tabs, activeTab, screen, act }) {
  const labels = { friends: L.tabFriends, clan: L.tabClan, chat: L.tabChat };
  const showFind = canFindClans(config, data.clan != null);
  const isFinding = activeTab === 'clan' && screen === 'discover';
  const badges = unreadBadges({ config, data, ui, activeTab, screen });

  // What is new on each tab: a count for friend requests and direct messages, a dot for the clan chat.
  // The badge itself is decorative; the tab's description says it in words (its name stays the tab's label).
  const news = {
    friends: badges.friends > 0 && { text: badgeText(badges.friends), words: `${badges.friends} friend request${badges.friends === 1 ? '' : 's'}` },
    clan: badges.clan && { text: '', words: 'New messages in the clan chat' },
    chat: badges.chat > 0 && { text: badgeText(badges.chat), words: `${badges.chat} unread message${badges.chat === 1 ? '' : 's'}` },
  };
  const descriptions = [];

  const tabButton = (tab) => {
    const item = news[tab];
    if (item) descriptions.push(h('span', { class: 'sk-sr-only', text: item.words, attrs: { id: `sk-tab-news-${tab}` } }));
    return h(
      'button',
      {
        class: 'sk-tab',
        attrs: { type: 'button', role: 'tab', 'aria-selected': tab === activeTab, 'aria-describedby': item ? `sk-tab-news-${tab}` : null },
        on: { click: () => act.setTab(tab) },
      },
      [labels[tab], item ? h('span', { class: item.text ? 'sk-badge-count' : 'sk-badge-dot', text: item.text, attrs: { 'aria-hidden': 'true' } }) : null],
    );
  };

  const bar = h(
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
  return [bar, ...descriptions];
}

/**
 * The whole widget: the panel (title, tabs, content), always open. There is no launcher button: the
 * game shows and hides the widget with its own button, by showing or hiding the container. The body
 * is the clan screen, the friends tab or the chat tab, whichever tab is active.
 */
export function panel(ctx) {
  const { config, L, data, ui, act, screen, position } = ctx;
  const tabs = enabledTabs(config);
  const activeTab = activeTabOf(config, ui.tab);
  const view = { clan: screen ? SCREEN_VIEWS[screen] : null, friends: friendsTab, chat: chatTab }[activeTab] ?? null;

  const content = h('div', { class: 'sk-content', attrs: { 'data-key': 'content' } }, view ? view(ctx).filter(Boolean) : []);
  const section = h('section', { class: 'sk-panel', attrs: { 'aria-label': L.panelTitle } }, [
    h('div', { class: 'sk-header' }, [
      h('h2', { class: 'sk-title', text: L.panelTitle }),
    ]),
    ...(tabs.length > 0 ? tabBar({ config, L, data, ui, tabs, activeTab, screen, act }) : []),
    content,
    // The badge popup lies over the whole panel (tabs included), not inside the scrolling content.
    ui.badgePickerOpen && activeTab === 'clan' && screen === 'create' ? badgeDialog({ config, ui, act, assets: ctx.assets }) : null,
  ]);

  return h('div', { class: 'sk-dock', attrs: { 'data-position': position } }, [section]);
}
