import { safeAssetUrl } from '../data/assets.js';
import { h } from '../dom/h.js';
import { image } from '../dom/image.js';

/**
 * A badge tile (decorative: the clan name next to it says everything the badge does). A custom badge
 * shows the game's image when `assets.badges` maps its name to a safe URL; otherwise its first letter.
 */
export function badgeTile(badge, { small = false, assets } = {}) {
  const url = badge.custom ? safeAssetUrl(assets?.badges?.[badge.id]) : null;
  return h(
    'span',
    {
      class: small ? 'sk-badge sk-badge-sm' : 'sk-badge',
      text: url ? null : badge.glyph,
      attrs: { 'aria-hidden': 'true' },
      vars: { '--sk-badge-bg': badge.bg, '--sk-badge-fg': badge.fg, '--sk-badge-shape': badge.shape },
    },
    [url ? image(url) : null],
  );
}
