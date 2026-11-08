export const SCREENS = ['discover', 'create', 'home', 'members'];

const OUTSIDE = ['discover', 'create'];
const INSIDE = ['home', 'members'];

const isEnabled = (config, screen) => config?.clan?.screens?.[screen]?.enabled !== false;

/**
 * The screen to show. Players without a clan only see discover and create, members of a clan only
 * home and members; a screen the config turns off is skipped. Returns null when nothing is available.
 */
export function resolveScreen(config, requested, isInClan) {
  const group = (isInClan ? INSIDE : OUTSIDE).filter((screen) => isEnabled(config, screen));
  return group.includes(requested) ? requested : (group[0] ?? null);
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
