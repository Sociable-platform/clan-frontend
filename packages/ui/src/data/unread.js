/**
 * Unread counts. The host says what is new in `data.unread`:
 *
 *   unread: { clan: 3, direct: { 'friend-id': 2 } }
 *
 * `clan` counts unread clan chat messages and `direct` unread direct messages per friend. Pending friend
 * requests need no extra field: they are `data.requests`. The panel decides what to badge from these, and
 * calls `actions.markRead(conversation)` when a conversation with unread messages is on screen
 * ('clan' or a friend's id), so the host can clear its count.
 */

/** A count the host sent, as a whole number of zero or more (anything else counts as nothing). */
export const countOf = (value) => (Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);

/** How a count is written on a badge: up to 9, then "9+" so the tab keeps its width. */
export const badgeText = (count) => (count > 9 ? '9+' : String(count));

/** Whether direct messages are on, so the per-friend counts mean anything. */
const hasDirectMessages = (config) => config?.chat?.enabled === true && config?.chat?.directMessages === true;

/** Whether the clan chat is on screen: the Clan tab's home screen, for a member, with clan chat on. */
function isClanChatShown(config, data, activeTab, screen) {
  return activeTab === 'clan' && screen === 'home' && data.clan != null && config?.chat?.enabled === true && config?.chat?.clanChat === true;
}

/** Which conversation is on screen now: 'clan', a friend's id, or null. */
export function shownConversation({ config, data, ui, activeTab, screen }) {
  if (isClanChatShown(config, data, activeTab, screen)) return 'clan';
  if (activeTab !== 'chat' || ui.convo == null || !hasDirectMessages(config)) return null;
  return (data.friends ?? []).some((friend) => friend.id === ui.convo) ? ui.convo : null;
}

/** The unread count the host sent for one conversation ('clan' or a friend's id), whether or not it is on screen. */
export function rawUnread(config, data, conversation) {
  if (conversation === 'clan') return countOf(data.unread?.clan);
  return hasDirectMessages(config) ? countOf(data.unread?.direct?.[conversation]) : 0;
}

/**
 * What to badge. Unread messages on screen are not badged: the open conversation's, and the clan chat's
 * while it shows. Friend requests stay counted on the Friends tab even while it is open, as they wait for an
 * answer (the badge swaps colours with the selected tab). Friend requests and direct messages are counted
 * (each needs the player); the clan chat only gets a dot, as a busy clan would make a big number that means little.
 */
export function unreadBadges({ config, data, ui, activeTab, screen }) {
  const shown = shownConversation({ config, data, ui, activeTab, screen });
  const direct = (id) => (id === shown ? 0 : rawUnread(config, data, id));
  return {
    friends: countOf((data.requests ?? []).length),
    chat: (data.friends ?? []).reduce((sum, friend) => sum + direct(friend.id), 0),
    clan: shown !== 'clan' && rawUnread(config, data, 'clan') > 0,
    direct,
  };
}
