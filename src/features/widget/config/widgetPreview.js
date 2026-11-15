/**
 * The views the preview can show. Home and members are what a clan member sees; discover and create,
 * a player without a clan; friends and chat are the other two tabs.
 */
export const PREVIEW_VIEWS = [
  { id: 'home', label: 'Home & chat', hint: 'in a clan' },
  { id: 'members', label: 'Members', hint: 'in a clan' },
  { id: 'discover', label: 'Discover', hint: 'no clan' },
  { id: 'create', label: 'Create', hint: 'no clan' },
  { id: 'friends', label: 'Friends', hint: null },
  { id: 'chat', label: 'Chat', hint: null },
];

export const DEFAULT_PREVIEW_SCREEN = 'home';

const IN_CLAN_SCREENS = ['home', 'members'];
const TAB_VIEWS = ['friends', 'chat'];

export const isClanScreen = (screenId) => IN_CLAN_SCREENS.includes(screenId);
export const isTabView = (viewId) => TAB_VIEWS.includes(viewId);

/** The clan screens, listed under the Clan tab of the preview picker. */
export const PREVIEW_CLAN_VIEWS = PREVIEW_VIEWS.filter((view) => !isTabView(view.id));

/** The picker's tabs, in the order of the widget's own tab bar. */
export const PREVIEW_TABS = [
  { id: 'friends', label: 'Friends' },
  { id: 'clan', label: 'Clan' },
  { id: 'chat', label: 'Chat' },
];

export const PREVIEW_FONTS_LINK_ATTRIBUTE = 'data-widget-preview-fonts';
