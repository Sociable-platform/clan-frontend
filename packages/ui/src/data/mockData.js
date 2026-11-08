import { maxMembers } from './limits.js';
import { normalizeRoles, roleIndex } from './roles.js';

const MY_CLAN = { id: 'clan-nova', name: 'Nova Squad', tag: 'NOVA', badge: 'star', description: 'Weekend raids, chill vibes. Ranked nights every Friday at 21:00.', memberCount: 4, level: 7, weeklyXp: '12.4k', ownerName: 'Murad', createdAt: '2026-11-02' };

const NAMES = ['Murad', 'Rashad', 'Farida', 'Aysel', 'Kamran', 'Leyla', 'Elvin', 'Nigar', 'Tural', 'Sevda', 'Orkhan', 'Gunel', 'Vugar', 'Aynur'];
const MIN_MEMBERS = 4;
const VIEWER_NAME = 'Samir';

/**
 * One member per role, most powerful first, topped up with plain members to at least four. When
 * `viewerRole` names a role, the first member of that role is the player ("Samir"), so a preview can show
 * what that role can do; with no `viewerRole` the player is not in the list.
 */
function mockMembers(config, viewerRole) {
  const roles = normalizeRoles(config);
  const roleIds = [...roles].reverse().map((role) => role.id);
  while (roleIds.length < MIN_MEMBERS) roleIds.push(roles[0].id);
  const members = roleIds.map((role, index) => ({ id: `m-${index}`, name: NAMES[index % NAMES.length], role }));

  const viewerIndex = viewerRole === undefined ? -1 : roleIndex(roles, viewerRole);
  const viewer = viewerIndex < 0 ? null : members.find((member) => member.role === roles[viewerIndex].id);
  if (viewer) viewer.name = VIEWER_NAME;
  return { members, viewerId: viewer?.id ?? 'p-you', viewerName: viewer ? VIEWER_NAME : 'You' };
}

/**
 * Fake data for the preview (no network): three open clans, one clan with four members, a short clan chat, three friends with a request and a direct-message thread each.
 * The second clan is always full, so the "Full" button shows whatever `clan.maxMembers` is.
 *
 * @param {object} config the experience config the preview shows
 * @param {{ inClan?: boolean, viewerRole?: string, overrides?: object }} [options]
 */
export function createMockData(config, { inClan = true, viewerRole, overrides = {} } = {}) {
  const max = maxMembers(config);
  const { members, viewerId, viewerName } = mockMembers(config, viewerRole);
  const owner = members.find((member) => member.role === normalizeRoles(config).at(-1).id);
  return {
    player: { id: viewerId, name: viewerName },
    clan: inClan ? { ...MY_CLAN, memberCount: members.length, ownerName: owner?.name ?? MY_CLAN.ownerName } : null,
    clans: [
      { id: 'clan-nova', name: 'Nova Squad', tag: 'NOVA', badge: 'star', description: 'Weekend raids, chill vibes', memberCount: 24 },
      { id: 'clan-wolves', name: 'Iron Wolves', tag: 'IRWF', badge: 'cross', description: 'Ranked grinders, EU nights', memberCount: max },
      { id: 'clan-caspian', name: 'Caspian Crew', tag: 'CSPN', badge: 'moon', description: 'Baku players, all levels welcome', memberCount: 8 },
    ],
    members,
    friends: [
      { id: 'f-rashad', name: 'Rashad', status: 'In arena', online: true },
      { id: 'f-farida', name: 'Farida', status: 'In lobby', online: true },
      { id: 'f-kamran', name: 'Kamran', status: 'Last seen 2h ago', online: false },
    ],
    requests: [{ id: 'r-aysel', name: 'Aysel' }],
    threads: {
      'f-rashad': [
        { id: 'r1', from: 'Rashad', body: 'gg, rematch?', mine: false },
        { id: 'r2', from: 'You', body: 'Sure, 2 min', mine: true },
        { id: 'r3', from: 'Rashad', body: config?.chat?.profanityFilter === true ? 'that last round was ****' : 'that last round was hell', mine: false },
      ],
      'f-farida': [
        { id: 'fa1', from: 'Farida', body: 'Saw your clan tag, looks good', mine: false },
        { id: 'fa2', from: 'You', body: 'Join Nova tonight?', mine: true },
        { id: 'fa3', from: 'Farida', body: 'Send me the clan, I will join', mine: false },
      ],
      'f-kamran': [{ id: 'k1', from: 'Kamran', body: 'brb, dinner', mine: false }],
    },
    messages: [
      { id: 'c1', from: 'Rashad', body: 'Raid at 9?', mine: false },
      { id: 'c2', from: 'You', body: 'In. Bring Farida', mine: true },
      { id: 'c3', from: 'Farida', body: 'On my way', mine: false },
    ],
    ...overrides,
  };
}
