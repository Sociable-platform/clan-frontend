const WHITE = '#FFFFFF';
const NEAR_BLACK = '#14161B';

/** WCAG minimum contrast for normal text. */
export const MIN_TEXT_CONTRAST = 4.5;

function luminance(hex) {
  const [red, green, blue] = [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio of two `#RRGGBB` colours (1 to 21), or null when either is not one. */
export function contrastRatio(first, second) {
  const isHex = (value) => /^#[0-9A-Fa-f]{6}$/.test(value ?? '');
  if (!isHex(first) || !isHex(second)) return null;

  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Text colour (white or near black) that reads best on `background`, as the widget picks it for buttons. */
export function readableTextOn(background) {
  return (contrastRatio(background, WHITE) ?? 0) >= (contrastRatio(background, NEAR_BLACK) ?? 0) ? WHITE : NEAR_BLACK;
}
