/**
 * Clan roles (`clan.roles`): the titles a member can hold, lowest power first. Power is the position in
 * the list: the first role is a new member's, the last is the clan owner's. See docs/config-v1/README.md.
 */
const FALLBACK_ROLES = [
  { id: 'member', name: 'Member', canPromote: false, canKick: false },
  { id: 'leader', name: 'Leader', canPromote: true, canKick: true },
];

/** Until the social service knows custom roles it sends `owner` and `member`: the last and the first role. */
const LEGACY_ALIASES = { owner: 'last', member: 'first' };

/** The config's roles, cleaned up (a draft can be mid-edit). Falls back to Member and Leader when fewer than two are usable. */
export function normalizeRoles(config) {
  const raw = Array.isArray(config?.clan?.roles) ? config.clan.roles : [];
  const seen = new Set();
  const roles = raw
    .filter((role) => role && typeof role.id === 'string' && role.id !== '' && !seen.has(role.id) && seen.add(role.id))
    .map((role) => ({
      id: role.id,
      name: typeof role.name === 'string' && role.name.trim() !== '' ? role.name : role.id,
      canPromote: role.canPromote === true,
      canKick: role.canKick === true,
    }));
  return roles.length >= 2 ? roles : FALLBACK_ROLES;
}

/** Position of a role id in the list, or -1. `owner` and `member` map to the last and first role when the game has no role of that id. */
export function roleIndex(roles, id) {
  const found = roles.findIndex((role) => role.id === id);
  if (found >= 0) return found;
  if (LEGACY_ALIASES[id] === 'last') return roles.length - 1;
  if (LEGACY_ALIASES[id] === 'first') return 0;
  return -1;
}

export function roleName(roles, id) {
  return roles[roleIndex(roles, id)]?.name ?? String(id ?? '');
}

export const isTopRole = (roles, id) => roleIndex(roles, id) === roles.length - 1;

const NONE = { promoteTo: null, demoteTo: null, canKick: false };

/**
 * What a member may do to another: promote one step up (only to a role below their own), demote one
 * step down, or kick. Only people of a lower role can be managed, never yourself. The owner's role has
 * every power. The server decides in the end; this only decides what the panel offers.
 */
export function abilitiesOver(roles, actorRoleId, targetRoleId) {
  const actor = roleIndex(roles, actorRoleId);
  const target = roleIndex(roles, targetRoleId);
  if (actor < 0 || target < 0 || actor <= target) return NONE;

  const isOwner = actor === roles.length - 1;
  const canPromote = isOwner || roles[actor].canPromote;
  return {
    promoteTo: canPromote && target + 1 < actor ? roles[target + 1] : null,
    demoteTo: canPromote && target > 0 ? roles[target - 1] : null,
    canKick: isOwner || roles[actor].canKick,
  };
}

export const hasAbilities = (abilities) => abilities.promoteTo !== null || abilities.demoteTo !== null || abilities.canKick;
