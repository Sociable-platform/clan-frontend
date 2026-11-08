import { safeAssetUrl } from '../data/assets.js';

/**
 * A decorative image from a URL the game supplied. Returns null unless the URL passes `safeAssetUrl`,
 * so nothing but an image address ever reaches `src`.
 */
export function image(url) {
  const safe = safeAssetUrl(url);
  if (!safe) return null;
  const element = document.createElement('img');
  element.setAttribute('src', safe);
  element.setAttribute('alt', '');
  element.setAttribute('draggable', 'false');
  element.setAttribute('class', 'sk-badge-image');
  return element;
}
