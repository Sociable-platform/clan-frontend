export const DEFAULT_TERMS = { clan: 'Clan', clans: 'Clans' };

/** Built-in texts. `{Clan}`, `{clan}`, `{Clans}` and `{clans}` are replaced with the game's own word. */
const DEFAULT_LABELS = {
  panelTitle: 'Social',
  // Not drawn any more (the panel has no launcher button). Kept because config v1 still accepts the key.
  launcher: 'Social',
  tabFriends: 'Friends',
  tabClan: '{Clan}',
  tabChat: 'Chat',
  accept: 'Accept',
  chatBtn: 'Chat',
  join: 'Join',
  full: 'Full',
  createCta: '+ Create a {clan}',
  createBtn: 'Create {clan}',
  cancel: 'Cancel',
  // Not drawn any more (the whole clan name row opens the info, marked by an arrow). Kept because config v1 still accepts the key.
  info: 'Info',
  viewMembers: 'View members',
  leave: 'Leave {clan}',
  send: 'Send',
  createTitle: 'Create a {clan}',
  membersTitle: 'Members',
  searchPlayers: 'Search players…',
  searchClans: 'Search {clans}…',
  messagePh: 'Message…',
  clanChatOff: '{Clan} chat is off for this game.',
  clanChatTitle: '{clan} chat',
  findClans: 'Find {clans}',
  joinLeaveFirst: 'Leave your {clan} to join another.',
  leaveShort: 'Leave',
  leaveWarn: 'You lose access to {clan} chat. You can join again later if there is room.',
  // The lines a clan member change draws in the clan chat. {player} is the player's name, filled in when drawn.
  memberJoined: '{player} joined the {clan}',
  memberLeft: '{player} left the {clan}',
  memberKicked: '{player} was removed from the {clan}',
};

const term = (value, fallback) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback);

/**
 * Resolved texts for a config: the game's own word for a clan is applied to the placeholders, then
 * any label the config overrides replaces the default. Replacement uses functions so `$&` and
 * similar in a config value are plain characters.
 */
export function buildLabels(config) {
  const clan = term(config?.texts?.terms?.clan, DEFAULT_TERMS.clan);
  const clans = term(config?.texts?.terms?.clans, DEFAULT_TERMS.clans);
  const resolve = (value) =>
    value
      .replace(/\{Clan\}/g, () => clan)
      .replace(/\{clan\}/g, () => clan.toLowerCase())
      .replace(/\{Clans\}/g, () => clans)
      .replace(/\{clans\}/g, () => clans.toLowerCase());

  const overrides = config?.texts?.labels ?? {};
  return Object.fromEntries(
    Object.entries(DEFAULT_LABELS).map(([key, fallback]) => {
      const custom = overrides[key];
      return [key, resolve(typeof custom === 'string' && custom !== '' ? custom : fallback)];
    }),
  );
}
