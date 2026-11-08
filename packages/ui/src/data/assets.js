/**
 * Images the game supplies for custom badges and textures. The config only names them
 * (`custom-dragon`); the game's own code maps each name to a file in `data.assets`:
 * `{ badges: { 'custom-dragon': '/img/dragon.png' }, textures: { 'custom-metal': '/img/metal.png' } }`.
 * A URL is used only if it passes `safeAssetUrl`, so even the host cannot slip markup or a script URL in.
 */
export const CUSTOM_ASSET_ID = /^custom-[a-z0-9]+(-[a-z0-9]+)*$/;

const MAX_ID_LENGTH = 32;
const DATA_IMAGE = /^data:image\/(?:png|webp|jpeg|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/;
const WEB_URL = /^(?:https?:\/\/|\/(?!\/)|\.{1,2}\/)[^\s"'()\\<>]+$/;
const RELATIVE_FILE = /^[A-Za-z0-9_][^\s"'()\\<>:]*$/;

export const isCustomAssetId = (id) => typeof id === 'string' && id.length <= MAX_ID_LENGTH && CUSTOM_ASSET_ID.test(id);

/** The URL if it is an http(s) address, a path in the game, or an inline PNG/WebP/JPEG/GIF/SVG image; otherwise null. */
export function safeAssetUrl(value) {
  if (typeof value !== 'string' || value === '') return null;
  return DATA_IMAGE.test(value) || WEB_URL.test(value) || RELATIVE_FILE.test(value) ? value : null;
}

/** "custom-ember-flame" as "Ember flame". */
export function assetName(id) {
  const words = String(id).replace(/^custom-/, '').replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
