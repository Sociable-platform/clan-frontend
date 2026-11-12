/**
 * Custom badges and textures a game developer imports in Studio. The image stays in this browser (for the
 * preview); the config only carries a name such as `custom-dragon`, and the game maps that name to a file
 * of its own (`docs/config-v1/README.md`, "Custom images").
 */
export const ASSET_KINDS = { BADGE: 'badge', TEXTURE: 'texture' };

export const CUSTOM_ASSET_PREFIX = 'custom-';
export const CUSTOM_ASSET_ID_PATTERN = /^custom-[a-z0-9]+(-[a-z0-9]+)*$/;

export const IMAGE_FORMATS = {
  PNG: { id: 'png', mime: 'image/png', label: 'PNG' },
  WEBP: { id: 'webp', mime: 'image/webp', label: 'WebP' },
  SVG: { id: 'svg', mime: 'image/svg+xml', label: 'SVG' },
};

export const ASSET_RULES = {
  [ASSET_KINDS.BADGE]: {
    maxBytes: 64 * 1024,
    formats: [IMAGE_FORMATS.PNG, IMAGE_FORMATS.WEBP, IMAGE_FORMATS.SVG],
    accept: '.png,.webp,.svg,image/png,image/webp,image/svg+xml',
    hint: 'PNG, WebP or SVG, up to 64 KB',
  },
  [ASSET_KINDS.TEXTURE]: {
    maxBytes: 256 * 1024,
    formats: [IMAGE_FORMATS.PNG, IMAGE_FORMATS.WEBP],
    accept: '.png,.webp,image/png,image/webp',
    hint: 'Tileable PNG or WebP, up to 256 KB',
  },
};

const formatList = (kind) => {
  const labels = ASSET_RULES[kind].formats.map((format) => format.label);
  return labels.length > 1 ? `${labels.slice(0, -1).join(', ')} or ${labels.at(-1)}` : labels[0];
};

export const ASSET_MESSAGES = {
  WRONG_FORMAT: (kind) => `Use ${formatList(kind)}. The file is not one of those formats.`,
  TOO_BIG: (kind) => `The file is too big. ${ASSET_RULES[kind].hint}.`,
  EMPTY: 'The file is empty.',
  UNSAFE_SVG: 'This SVG contains a script or an embedded page, which is not allowed. Export a plain SVG.',
  READ_FAILED: 'Could not read the file. Try again.',
  STORAGE_FULL: 'This browser has no room left to keep the image. Remove one you do not use and try again.',
  TOO_MANY_BADGES: 'Up to 12 badges can be on at once. Turn one off first.',
};

export const ASSET_STORAGE_PREFIX = 'clan.studio.assets.';
export const MAX_ASSET_SLUG_LENGTH = 32 - CUSTOM_ASSET_PREFIX.length;
