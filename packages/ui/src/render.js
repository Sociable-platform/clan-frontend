import { panel } from './components/panel.js';
import { allowedBadges } from './data/badges.js';
import { activeTabOf, enabledTabs, resolveScreen } from './data/screens.js';
import { countOf, rawUnread, shownConversation } from './data/unread.js';
import { h } from './dom/h.js';
import { PANEL_CSS } from './styles/panelStyles.js';
import { buildLabels } from './text/labels.js';
import { resolveTheme } from './theme/theme.js';

function createUiState(config, data) {
  return {
    tab: data.tab ?? null,
    screen: data.screen ?? null,
    infoOpen: false,
    confirmLeave: false,
    selectedMember: null,
    confirmKick: null,
    selectedFriend: null,
    blockedOpen: false,
    confirmFriend: null,
    query: '',
    playerQuery: '',
    chatQuery: '',
    convo: data.convo ?? null,
    backTo: null,
    draft: '',
    badgePickerOpen: false,
    // Where the "New messages" line goes in the conversation on screen: { conversation, from } (from is null without one).
    newMessages: null,
    // The last conversation and count handed to `actions.markRead`, so the same news is not reported twice.
    markedRead: null,
    form: { name: '', tag: '', description: '', badge: null },
    focusKey: null,
  };
}

/**
 * Where the first of the last `unread` messages from other players is (the count never includes the player's
 * own), or null without unread messages. When there are fewer such messages than the count, it is the first one.
 */
function firstUnread(messages, unread) {
  if (unread <= 0) return null;
  let left = unread;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].mine === true) continue;
    left -= 1;
    if (left === 0) return index;
  }
  const first = messages.findIndex((message) => message.mine !== true);
  return first === -1 ? null : first;
}

/**
 * Mount the clan panel into `container` and return `{ update, destroy }`.
 *
 * - `config` is a validated experience config v1 document.
 * - `data` is what the panel shows: `{ player, clan, clans, members, messages }` plus optional
 *   `friends`, `requests`, `blocked`, `threads` (direct messages by friend id), `assets` (the game's own images for
 *   custom badges and textures, by name: `{ badges, textures }`), optional `screen`, `tab`, `open`
 *   to control the view, and `actions` the host wants called (`join`, `create`, `leave`, `sendMessage`,
 *   `acceptRequest`, `declineRequest`, `removeFriend`, `blockFriend`, `unblock`, `addFriend`, `cancelFriendRequest`, `setRole`, `kick`, `screenChanged`, `tabChanged`). `clan` null means the player is in no clan.
 *
 * The panel lives in a Shadow DOM so game CSS cannot reach it, and every string from the config or
 * the data is written with `textContent`, never parsed as HTML.
 */
export function render(container, config, data = {}) {
  const host = document.createElement('div');
  host.setAttribute('data-clan-ui', '');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = PANEL_CSS;
  const root = h('div', { class: 'sk-root' });
  // Says what just arrived (a friend request, a message) to screen readers. It lives outside the root, which every repaint replaces.
  const announcer = h('div', { class: 'sk-sr-only', attrs: { role: 'status', 'aria-live': 'polite', 'data-clan-ui-announcer': '' } });
  shadow.append(style, root, announcer);
  let lastNews = null;
  container.append(host);

  let current = { config, data };
  let appliedVars = [];
  let destroyed = false;
  let controlled = { screen: data.screen, tab: data.tab, convo: data.convo };
  const ui = createUiState(config, data);

  const actions = () => current.data.actions ?? {};
  const act = {
    repaint: () => paint(),
    navigate: (screen) => {
      ui.screen = screen;
      ui.badgePickerOpen = false;
      ui.confirmLeave = false;
      paint();
      actions().screenChanged?.(screen);
    },
    setTab: (tab) => {
      ui.tab = tab;
      ui.badgePickerOpen = false;
      ui.backTo = null;
      // The Chat tab always opens on the conversation list.
      ui.convo = null;
      ui.draft = '';
      paint();
      actions().tabChanged?.(tab);
    },
    openChat: (friendId) => {
      ui.backTo = 'friends';
      ui.convo = friendId;
      ui.tab = 'chat';
      ui.draft = '';
      paint();
      actions().tabChanged?.('chat');
    },
    selectConversation: (id) => {
      ui.convo = id;
      ui.draft = '';
      paint();
    },
    goBack: () => {
      ui.tab = ui.backTo;
      ui.backTo = null;
      ui.draft = '';
      paint();
      actions().tabChanged?.(ui.tab);
    },
    acceptRequest: (requestId) => actions().acceptRequest?.(requestId),
    declineRequest: (requestId) => actions().declineRequest?.(requestId),
    selectFriend: (friendId) => {
      ui.selectedFriend = friendId;
      ui.confirmFriend = null;
      paint();
    },
    askFriendAction: (friendId, action) => {
      ui.confirmFriend = { id: friendId, action };
      paint();
    },
    cancelFriendAction: () => {
      ui.confirmFriend = null;
      paint();
    },
    removeFriend: (friendId) => {
      ui.confirmFriend = null;
      ui.selectedFriend = null;
      paint();
      actions().removeFriend?.(friendId);
    },
    blockFriend: (friendId) => {
      ui.confirmFriend = null;
      ui.selectedFriend = null;
      paint();
      actions().blockFriend?.(friendId);
    },
    toggleBlocked: () => {
      ui.blockedOpen = !ui.blockedOpen;
      paint();
    },
    // The pressed row goes away once the host updates the list, so the focus moves to the drop-down's button.
    unblock: (playerId) => {
      ui.focusKey = 'blocked-toggle';
      paint();
      actions().unblock?.(playerId);
    },
    toggleInfo: () => {
      ui.infoOpen = !ui.infoOpen;
      ui.confirmLeave = false;
      paint();
    },
    // The search icon on the Clan tab: open the clan search from any tab, or close it again.
    findClans: () => {
      ui.tab = 'clan';
      ui.backTo = null;
      ui.confirmLeave = false;
      ui.screen = 'discover';
      paint();
      actions().tabChanged?.('clan');
      actions().screenChanged?.('discover');
    },
    selectMember: (memberId) => {
      ui.selectedMember = memberId;
      ui.confirmKick = null;
      paint();
    },
    setRole: (memberId, roleId) => actions().setRole?.(memberId, roleId),
    addFriend: (playerId) => actions().addFriend?.(playerId),
    cancelFriendRequest: (playerId, requestId) => actions().cancelFriendRequest?.(playerId, requestId),
    askKick: (memberId) => {
      ui.confirmKick = memberId;
      paint();
    },
    cancelKick: () => {
      ui.confirmKick = null;
      paint();
    },
    kick: (memberId) => {
      ui.confirmKick = null;
      ui.selectedMember = null;
      paint();
      actions().kick?.(memberId);
    },
    askLeave: () => {
      ui.confirmLeave = true;
      paint();
    },
    cancelLeave: () => {
      ui.confirmLeave = false;
      paint();
    },
    leave: () => {
      ui.confirmLeave = false;
      ui.infoOpen = false;
      paint();
      actions().leave?.();
    },
    // A player in a clan cannot join another: the button is off, and this keeps a stray click from asking the host.
    join: (clanId) => (current.data.clan == null ? actions().join?.(clanId) : undefined),
    create: (payload) => actions().create?.(payload),
    sendMessage: (text, conversation) => {
      ui.draft = '';
      paint();
      actions().sendMessage?.(text, { conversation });
    },
  };

  function paint() {
    if (destroyed) return;
    const { config: cfg, data: dat } = current;
    const theme = resolveTheme(cfg, dat.assets);
    // A setting that is gone (a part switched back to the theme) must not leave its old value behind.
    appliedVars.filter((name) => !(name in theme.vars)).forEach((name) => root.style.removeProperty(name));
    Object.entries(theme.vars).forEach(([name, value]) => root.style.setProperty(name, value));
    appliedVars = Object.keys(theme.vars);

    const isInClan = dat.clan != null;
    const screen = resolveScreen(cfg, ui.screen ?? (isInClan ? 'home' : 'discover'), isInClan);
    if (!isInClan) ui.confirmLeave = false;
    if (screen !== 'create') ui.badgePickerOpen = false;
    if (ui.selectedMember != null && !(dat.members ?? []).some((member) => member.id === ui.selectedMember)) {
      ui.selectedMember = null;
      ui.confirmKick = null;
    }
    if (ui.selectedFriend != null && !(dat.friends ?? []).some((friend) => friend.id === ui.selectedFriend)) {
      ui.selectedFriend = null;
      ui.confirmFriend = null;
    }
    if (!ui.form.badge) ui.form.badge = allowedBadges(cfg)[0]?.id ?? null;

    // A repaint replaces every node, so keep the scroll position and whichever box had focus.
    const scroller = root.querySelector('[data-key="content"]');
    const scrollTop = scroller?.scrollTop ?? 0;
    // The message list scrolls on its own (see .sk-chat). Remember where the reader was in it.
    const chat = root.querySelector('[data-key="chat"]');
    const chatBefore = chat && {
      label: chat.getAttribute('aria-label'),
      count: chat.childElementCount,
      scrollTop: chat.scrollTop,
      atEnd: chat.scrollHeight - chat.scrollTop - chat.clientHeight < 24,
    };
    const focusKey = ui.focusKey ?? shadow.activeElement?.getAttribute('data-key');
    ui.focusKey = null;

    // The conversation on screen, and where its "New messages" line goes. The line is placed once, when the
    // conversation opens, and stays while it is open even after the host clears the count.
    const shown = shownConversation({ config: cfg, data: dat, ui, activeTab: activeTabOf(cfg, ui.tab), screen });
    if (shown !== (ui.newMessages?.conversation ?? null)) {
      const unread = shown ? rawUnread(cfg, dat, shown) : 0;
      const messages = (shown === 'clan' ? dat.messages : dat.threads?.[shown]) ?? [];
      ui.newMessages = shown ? { conversation: shown, from: firstUnread(messages, unread) } : null;
    }

    root.replaceChildren(
      panel({ config: cfg, L: buildLabels(cfg), data: { ...dat, clan: dat.clan ?? null }, assets: dat.assets ?? {}, ui, act, screen, position: theme.position }),
    );

    const next = root.querySelector('[data-key="content"]');
    if (next) next.scrollTop = scrollTop;
    // A conversation opens at its newest message and follows new ones. Someone who scrolled up to read
    // stays where they are when another player writes; their own new message brings them back down.
    const nextChat = root.querySelector('[data-key="chat"]');
    if (nextChat) {
      const sameConversation = chatBefore && chatBefore.label === nextChat.getAttribute('aria-label');
      const wroteNow = sameConversation && nextChat.childElementCount > chatBefore.count && nextChat.lastElementChild?.getAttribute('data-mine') === 'true';
      // A conversation opened with unread messages starts at the "New messages" line, so nothing is skipped.
      const newLine = !sameConversation ? nextChat.querySelector('[data-key="new-messages"]') : null;
      if (newLine) nextChat.scrollTop = Math.max(0, newLine.offsetTop - 8);
      else nextChat.scrollTop = sameConversation && !chatBefore.atEnd && !wroteNow ? chatBefore.scrollTop : nextChat.scrollHeight;
    }
    if (focusKey && focusKey !== 'content') root.querySelector(`[data-key="${focusKey}"]`)?.focus();

    reportRead(cfg, dat, shown);
    announceNews(cfg, dat, shown);
  }

  /** Tell the host the player is looking at a conversation that has unread messages, once per count. */
  function reportRead(cfg, dat, shown) {
    const unread = shown ? rawUnread(cfg, dat, shown) : 0;
    if (unread === 0) {
      if (ui.markedRead?.conversation === shown) ui.markedRead = null;
      return;
    }
    if (ui.markedRead?.conversation === shown && ui.markedRead.count === unread) return;
    ui.markedRead = { conversation: shown, count: unread };
    // After this paint, so a host that clears the count with update() right away does not repaint mid-paint.
    queueMicrotask(() => {
      if (!destroyed) actions().markRead?.(shown);
    });
  }

  /** Say what is new since the last paint: a friend request, a message from a friend, a message in the clan chat. Not what is on screen. */
  function announceNews(cfg, dat, shown) {
    const news = {
      requests: countOf((dat.requests ?? []).length),
      clan: rawUnread(cfg, dat, 'clan'),
      direct: Object.fromEntries((dat.friends ?? []).map((friend) => [friend.id, rawUnread(cfg, dat, friend.id)])),
    };
    const before = lastNews;
    lastNews = news;
    if (!before) return;
    const lines = [];
    if (news.requests > before.requests) lines.push('New friend request');
    (dat.friends ?? []).forEach((friend) => {
      if (friend.id !== shown && news.direct[friend.id] > (before.direct[friend.id] ?? 0)) lines.push(`New message from ${friend.name}`);
    });
    if (shown !== 'clan' && news.clan > before.clan) lines.push(`New message in ${dat.clan?.name ?? 'the clan chat'}`);
    if (lines.length > 0) announcer.textContent = lines.join('. ');
  }

  paint();

  return {
    /** Show a new config and/or data. A `screen`, `tab` or `convo` that did not change is not re-applied. */
    update(nextConfig, nextData = {}) {
      if (destroyed) return;
      current = { config: nextConfig, data: nextData };
      if (nextData.tab !== undefined && nextData.tab !== controlled.tab) ui.backTo = null;
      ['screen', 'tab', 'convo'].forEach((key) => {
        if (nextData[key] !== undefined && nextData[key] !== controlled[key]) {
          ui[key] = nextData[key];
          if (key === 'screen' || key === 'tab') ui.badgePickerOpen = false;
        }
      });
      controlled = { screen: nextData.screen, tab: nextData.tab, convo: nextData.convo };
      if (enabledTabs(nextConfig).length === 0) ui.tab = null;
      paint();
    },
    /** Remove the panel and everything it added. Safe to call twice. */
    destroy() {
      destroyed = true;
      host.remove();
    },
  };
}
