import { isCustomAssetId, safeAssetUrl } from '../data/assets.js';
import { toRgba } from './color.js';

/** The textures built into the panel, drawn with CSS gradients. A config names one by id, never by URL. */
const GRADIENTS = {
  tex_stone: (a, b) =>
    `repeating-linear-gradient(45deg, ${a} 0 2px, transparent 2px 9px), repeating-linear-gradient(-45deg, ${b} 0 1px, transparent 1px 13px)`,
  tex_grid: (a) =>
    `repeating-linear-gradient(0deg, ${a} 0 1px, transparent 1px 12px), repeating-linear-gradient(90deg, ${a} 0 1px, transparent 1px 12px)`,
  tex_wood: (a, b) =>
    `repeating-linear-gradient(90deg, ${a} 0 1px, transparent 1px 7px), repeating-linear-gradient(90deg, ${b} 0 3px, transparent 3px 23px)`,
  tex_carbon: (a) => `repeating-linear-gradient(135deg, ${a} 0 3px, transparent 3px 6px)`,
};

export const TEXTURE_ASSETS = Object.keys(GRADIENTS);

/** How much of a custom texture shows through: the rest is the slot's own color, so text over it stays readable. */
const CUSTOM_TEXTURE_COVER = 0.82;

/** CSS `background-image` for a built-in texture (`{ asset }` or nothing), tinted with the two lines. */
export function textureImage(texture, lineA, lineB) {
  const draw = GRADIENTS[texture?.asset];
  return draw ? draw(lineA, lineB) : 'none';
}

/**
 * The image for one texture slot. A built-in texture is a gradient. A custom one (`custom-metal`) is the
 * game's own file from `assets.textures`, tiled under a translucent layer of `coverColor` (the slot's
 * own color), which is how "subtle" is enforced. A custom name the game has not mapped is no texture.
 */
export function slotTexture(texture, assets, lines, coverColor) {
  if (isCustomAssetId(texture?.asset)) {
    const url = safeAssetUrl(assets?.textures?.[texture.asset]);
    if (!url) return 'none';
    const cover = toRgba(coverColor, CUSTOM_TEXTURE_COVER);
    return `linear-gradient(${cover}, ${cover}), url("${url}")`;
  }
  return textureImage(texture, ...lines);
}
