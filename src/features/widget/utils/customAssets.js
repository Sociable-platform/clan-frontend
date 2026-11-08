import {
  ASSET_MESSAGES,
  ASSET_RULES,
  CUSTOM_ASSET_ID_PATTERN,
  CUSTOM_ASSET_PREFIX,
  IMAGE_FORMATS,
  MAX_ASSET_SLUG_LENGTH,
} from '../config/widgetAssets';
import { WIDGET_LIMITS } from '../config/widgetConfig';

export const isCustomAssetId = (id) =>
  typeof id === 'string' && id.length <= WIDGET_LIMITS.CUSTOM_ASSET_ID_MAX && CUSTOM_ASSET_ID_PATTERN.test(id);

/** "custom-ember-flame" as "Ember flame". */
export function assetLabel(id) {
  const words = String(id).replace(CUSTOM_ASSET_PREFIX, '').replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const slugOf = (fileName) =>
  String(fileName)
    .replace(/\.[^.]*$/, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * The config name for an imported file: `Dragon Badge.png` becomes `custom-dragon-badge`. A name that is
 * already taken gets `-2`, `-3`, and so on. The result always matches the schema's pattern and length.
 */
export function assetIdFromFileName(fileName, takenIds = []) {
  const slug = slugOf(fileName).slice(0, MAX_ASSET_SLUG_LENGTH).replace(/-+$/, '') || 'image';
  const taken = new Set(takenIds);
  let candidate = `${CUSTOM_ASSET_PREFIX}${slug}`;
  for (let counter = 2; taken.has(candidate); counter += 1) {
    const suffix = `-${counter}`;
    candidate = `${CUSTOM_ASSET_PREFIX}${slug.slice(0, MAX_ASSET_SLUG_LENGTH - suffix.length).replace(/-+$/, '')}${suffix}`;
  }
  return candidate;
}

const startsWith = (bytes, signature, offset = 0) => signature.every((value, index) => bytes[offset + index] === value);

/** Which image format the bytes are, judged by the file's own header and not by its name or declared type. */
export function sniffImageFormat(bytes) {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return IMAGE_FORMATS.PNG;
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return IMAGE_FORMATS.WEBP;
  const head = new TextDecoder().decode(bytes.slice(0, 512)).replace(/^﻿/, '').trimStart().toLowerCase();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return IMAGE_FORMATS.SVG;
  return null;
}

const UNSAFE_SVG = /<script|<foreignobject|<iframe|<object|<embed|javascript:|\son[a-z]+\s*=/i;

/** `null` when the bytes are an acceptable image for this kind, otherwise the message to show. */
export function checkImageBytes(bytes, kind) {
  const rules = ASSET_RULES[kind];
  if (bytes.length === 0) return ASSET_MESSAGES.EMPTY;
  if (bytes.length > rules.maxBytes) return ASSET_MESSAGES.TOO_BIG(kind);
  const format = sniffImageFormat(bytes);
  if (!format || !rules.formats.some((allowed) => allowed.id === format.id)) return ASSET_MESSAGES.WRONG_FORMAT(kind);
  if (format.id === IMAGE_FORMATS.SVG.id && UNSAFE_SVG.test(new TextDecoder().decode(bytes))) return ASSET_MESSAGES.UNSAFE_SVG;
  return null;
}

const CHUNK = 0x8000;

/** A `data:` URL for the bytes, with the MIME type of the sniffed format. */
export function toDataUrl(bytes, format) {
  let binary = '';
  for (let index = 0; index < bytes.length; index += CHUNK) binary += String.fromCharCode(...bytes.subarray(index, index + CHUNK));
  return `data:${format.mime};base64,${btoa(binary)}`;
}

/** The `assets` option to give the SDK, with a placeholder path per name for the developer to replace. */
export function buildAssetsSnippet({ badgeIds = [], textureIds = [] }) {
  const entries = (ids, folder) => ids.map((id) => `      '${id}': '/path/to/${folder}/${id.replace(CUSTOM_ASSET_PREFIX, '')}.png',`).join('\n');
  const sections = [
    badgeIds.length > 0 ? `    badges: {\n${entries(badgeIds, 'badges')}\n    },` : null,
    textureIds.length > 0 ? `    textures: {\n${entries(textureIds, 'textures')}\n    },` : null,
  ].filter(Boolean);
  if (sections.length === 0) return '';
  return `SocialKit.init({\n  // publicKey, token, ...\n  assets: {\n${sections.join('\n')}\n  },\n});`;
}
