export const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const toChannels = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));

const toLinear = (channel) => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const [r, g, b] = toChannels(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast ratio between two `#RRGGBB` colors. */
export function contrastRatio(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const ON_COLOR_LIGHT = '#FFFFFF';
const ON_COLOR_DARK = '#14161B';

/** Text color (white or near-black) that reads best on `hex`. */
export function pickOnColor(hex) {
  return contrastRatio(hex, ON_COLOR_LIGHT) >= contrastRatio(hex, ON_COLOR_DARK) ? ON_COLOR_LIGHT : ON_COLOR_DARK;
}

/** Lighten (amount > 0) or darken (amount < 0) a color by mixing it toward white or black. */
export function shade(hex, amount) {
  const target = amount > 0 ? 255 : 0;
  const weight = Math.abs(amount);
  const mixed = toChannels(hex).map((channel) =>
    Math.round(channel + (target - channel) * weight)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${mixed.join('').toUpperCase()}`;
}

export function toRgba(hex, alpha) {
  return `rgba(${toChannels(hex).join(', ')}, ${alpha})`;
}
