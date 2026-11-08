import { ASSET_KINDS } from '../config/widgetAssets';
import { TEXTURE_SLOTS, TEXTURES } from '../config/widgetOptions';
import { isCustomAssetId } from './customAssets';

const unique = (list) => [...new Set(list)];

/**
 * What a texture picker offers: the built-in textures plus every custom name known to this game, whether
 * its image was imported in this browser or a slot of the draft already uses its name.
 * `fields` are the bound texture slots, `imported` the library (`assets.library.texture`).
 */
export function textureChoices(bind, assets) {
  const fields = Object.fromEntries(TEXTURE_SLOTS.map((slot) => [slot.key, bind(`/theme/textures/${slot.key}`)]));
  const imported = assets.library[ASSET_KINDS.TEXTURE];
  const usedIds = TEXTURE_SLOTS.map((slot) => fields[slot.key].value?.asset).filter(isCustomAssetId);
  const customIds = unique([...Object.keys(imported), ...usedIds]);
  return { fields, imported, usedIds, customIds, builtIn: TEXTURES };
}
