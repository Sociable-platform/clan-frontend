export const SCREENS = ['discover', 'create', 'home', 'members'];

const OUTSIDE = ['discover', 'create'];
const INSIDE = ['home', 'members', 'discover'];

const isEnabled = (config, screen) => config?.clan?.screens?.[screen]?.enabled !== false;

/**
 * The screen to show. Players without a clan see discover and create; members of a clan see home and
 * members, and discover too, to look at other clans (they cannot join one, or create one, while in a
 * clan). A screen the config turns off is skipped. Returns null when nothing is available. The first
 * screen of a group is its default, so a member of a clan lands on home.
 */
export function resolveScreen(config, requested, isInClan) {
  const group = (isInClan ? INSIDE : OUTSIDE).filter((screen) => isEnabled(config, screen));
  return group.includes(requested) ? requested : (group[0] ?? null);
}

/** Whether the Clan tab carries the "find clans" search icon: for a member of a clan, when the config has the discover screen on. */
export function canFindClans(config, isInClan) {
  return isInClan && config?.clan?.enabled === true && isEnabled(config, 'discover');
}

/** The tabs the panel shows, from the config's feature switches. */
export function enabledTabs(config) {
  const chat = config?.chat;
  return [
    config?.friends?.enabled === true && 'friends',
    config?.clan?.enabled === true && 'clan',
    chat?.enabled === true && (chat.directMessages === true || chat.clanChat === true) && 'chat',
  ].filter(Boolean);
}
