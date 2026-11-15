import { maxMembers } from './limits.js';
import { normalizeRoles, roleIndex } from './roles.js';

const MY_CLAN = { id: 'clan-nova', name: 'Nova Squad', tag: 'NOVA', badge: 'star', description: 'Weekend raids, chill vibes. Ranked nights every Friday at 21:00.', memberCount: 4, level: 7, weeklyXp: '12.4k', ownerName: 'Alex', createdAt: '2026-11-02' };

const NAMES = ['Alex', 'Ben', 'Cara', 'Dana', 'Eli', 'Fay', 'Gus', 'Hana', 'Ian', 'Jade', 'Kai', 'Lena', 'Max', 'Nina'];
const MIN_MEMBERS = 4;
const VIEWER_NAME = 'Sam';

/**
 * One member per role, most powerful first, topped up with plain members to at least four. When
 * `viewerRole` names a role, the first member of that role is the player ("Sam"), so a preview can show
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

/** A time `minutes` before now, so the preview's messages read as just written. */
const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

/**
 * Fake data for the preview (no network): three open clans, one clan with four members, a short clan chat, three friends with a request and a direct-message thread each, and two blocked players.
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
      { id: 'clan-harbor', name: 'Harbor Crew', tag: 'HRBR', badge: 'moon', description: 'Coastal players, all levels welcome', memberCount: 8 },
    ],
    members,
    friends: [
      // The clan each friend is in shows under their name; Eli is in none. Online is the dot on the picture.
      { id: 'f-ben', name: 'Ben', online: true, clan: { name: 'Nova Squad', tag: 'NOVA' } },
      { id: 'f-cara', name: 'Cara', online: true, clan: { name: 'Harbor Crew', tag: 'HRBR' } },
      { id: 'f-eli', name: 'Eli', online: false, clan: null },
    ],
    requests: [{ id: 'r-dana', name: 'Dana' }],
    blocked: [
      { id: 'b-finn', name: 'Finn' },
      { id: 'b-gina', name: 'Gina' },
    ],
    threads: {
      'f-ben': [
        { id: 'r1', from: 'Ben', body: 'gg, rematch?', mine: false, at: minutesAgo(42) },
        { id: 'r2', from: 'You', body: 'Sure, 2 min', mine: true, at: minutesAgo(41) },
        { id: 'r3', from: 'Ben', body: config?.chat?.profanityFilter === true ? 'that last round was ****' : 'that last round was hell', mine: false, at: minutesAgo(40) },
      ],
      'f-cara': [
        { id: 'fa1', from: 'Cara', body: 'Saw your clan tag, looks good', mine: false, at: minutesAgo(95) },
        { id: 'fa2', from: 'You', body: 'Join Nova tonight?', mine: true, at: minutesAgo(94) },
        { id: 'fa3', from: 'Cara', body: 'Send me the clan, I will join', mine: false, at: minutesAgo(20) },
      ],
      'f-eli': [{ id: 'k1', from: 'Eli', body: 'brb, dinner', mine: false, at: minutesAgo(180) }],
    },
    messages: [
      { id: 'c1', from: 'Ben', body: 'Raid at 9?', mine: false, at: minutesAgo(12) },
      { id: 'c2', from: 'You', body: 'In. Bring Cara', mine: true, at: minutesAgo(11) },
      { id: 'c3', from: 'Cara', body: 'On my way', mine: false, at: minutesAgo(3) },
    ],
    // What the player has not read yet: Ben's and Cara's last messages, and Cara's in the clan chat.
    unread: { clan: 1, direct: { 'f-ben': 1, 'f-cara': 1 } },
    ...overrides,
  };
}
