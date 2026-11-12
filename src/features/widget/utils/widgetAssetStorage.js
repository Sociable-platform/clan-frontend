import { ASSET_KINDS, ASSET_STORAGE_PREFIX } from '../config/widgetAssets';
import { isCustomAssetId } from './customAssets';

const DATA_IMAGE = /^data:image\/(?:png|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/;
const EMPTY = { [ASSET_KINDS.BADGE]: {}, [ASSET_KINDS.TEXTURE]: {} };

const keyOf = (gameId) => `${ASSET_STORAGE_PREFIX}${gameId}`;

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The images imported for a game in this browser: `{ badge: { id: dataUrl }, texture: { id: dataUrl } }`. Anything malformed is dropped. */
export function loadWidgetAssets(gameId) {
  const result = { [ASSET_KINDS.BADGE]: {}, [ASSET_KINDS.TEXTURE]: {} };
  try {
    const stored = JSON.parse(getStorage()?.getItem(keyOf(gameId)) ?? 'null');
    Object.values(ASSET_KINDS).forEach((kind) => {
      Object.entries(stored?.[kind] ?? {}).forEach(([id, dataUrl]) => {
        if (isCustomAssetId(id) && typeof dataUrl === 'string' && DATA_IMAGE.test(dataUrl)) result[kind][id] = dataUrl;
      });
    });
  } catch {
    return { ...EMPTY, [ASSET_KINDS.BADGE]: {}, [ASSET_KINDS.TEXTURE]: {} };
  }
  return result;
}

/** Keeps the images. Returns false when the browser refuses (storage full or blocked). */
export function saveWidgetAssets(gameId, assets) {
  try {
    getStorage()?.setItem(keyOf(gameId), JSON.stringify(assets));
    return getStorage() !== null;
  } catch {
    return false;
  }
}
