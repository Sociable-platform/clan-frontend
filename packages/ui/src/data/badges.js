import { assetName, isCustomAssetId } from './assets.js';

/** The badge icons built into the panel. A config and a clan name one by id; nothing here comes from them. */
const BADGES = [
  { id: 'star', name: 'Star', glyph: '★', shape: '8px 8px 20px 20px', bg: '#80EAFF', fg: '#141D1F' },
  { id: 'diamond', name: 'Diamond', glyph: '◆', shape: '50%', bg: '#E5484D', fg: '#FFFFFF' },
  { id: 'peak', name: 'Peak', glyph: '▲', shape: '8px', bg: '#2E8B57', fg: '#FFFFFF' },
  { id: 'spark', name: 'Spark', glyph: '✦', shape: '8px 8px 20px 20px', bg: '#F5A524', fg: '#14161B' },
  { id: 'moon', name: 'Moon', glyph: '☾', shape: '50%', bg: '#2F6BFF', fg: '#FFFFFF' },
  { id: 'cross', name: 'Cross', glyph: '✚', shape: '8px', bg: '#3A3D4A', fg: '#F2F2F7' },
];

export const BADGE_IDS = BADGES.map((badge) => badge.id);

/** A game-supplied badge: drawn from the game's own image when it maps one, else a neutral tile with the first letter. */
function customBadge(id) {
  const name = assetName(id);
  return { id, name, glyph: name.charAt(0), shape: '8px', bg: 'var(--sk-surface2)', fg: 'var(--sk-text)', custom: true };
}

/** Badges the game allows, in the config's order: built-in ones and custom names. An empty or missing list means none. */
export function allowedBadges(config) {
  const ids = config?.clan?.badges?.allowed;
  const wanted = Array.isArray(ids) ? ids : BADGE_IDS;
  return wanted.map((id) => BADGES.find((badge) => badge.id === id) ?? (isCustomAssetId(id) ? customBadge(id) : null)).filter(Boolean);
}

/** The badge picked on the create screen: the one with this id if the game allows it, else the first allowed one, else null. */
export function selectedBadge(config, id) {
  const allowed = allowedBadges(config);
  return allowed.find((badge) => badge.id === id) ?? allowed[0] ?? null;
}

/**
 * The badge to draw for an id: that badge if allowed, else the first allowed one, else a neutral
 * tile with the clan's initial ("an empty list falls back to a neutral tag").
 */
export function badgeFor(config, id, initial = '?') {
  const allowed = allowedBadges(config);
  const found = allowed.find((badge) => badge.id === id) ?? allowed[0];
  return found ?? { id: 'none', name: 'Tag', glyph: initial, shape: '8px', bg: 'var(--sk-surface2)', fg: 'var(--sk-text)' };
}
