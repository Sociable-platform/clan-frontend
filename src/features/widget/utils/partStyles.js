import { CORNER_RADIUS, PART_RADIUS_INSET, THEME_BORDER } from '../config/widgetParts';
import { readableTextOn } from './contrast';

/**
 * The full style of a part as the theme gives it today. Customizing a part starts from this, so switching
 * it on changes nothing you can see until a value is edited.
 */
export function seedPartStyle(key, theme) {
  const { brand, background, surface, text, muted } = theme.colors;
  const radius = Math.max(0, (CORNER_RADIUS[theme.frame?.corners] ?? CORNER_RADIUS.soft) - PART_RADIUS_INSET);
  const border = THEME_BORDER[theme.mode] ?? THEME_BORDER.dark;
  const look = {
    bubbleMine: { background: brand, text: readableTextOn(brand) },
    bubbleTheirs: { background: surface, text },
    button: { background: brand, text: readableTextOn(brand) },
    buttonSecondary: { background, text, borderStyle: 'solid', borderColor: border },
    tab: { background, text: muted },
    tabSelected: { background: brand, text: readableTextOn(brand) },
    row: { background: surface, text },
  }[key];

  return { borderStyle: 'none', borderWidth: 1, borderColor: border, radius, ...look };
}

/** What a field of a part shows: its own value, or what the theme gives it when the config leaves it out. */
export const effectivePart = (part, seed) => ({ ...seed, ...part });
