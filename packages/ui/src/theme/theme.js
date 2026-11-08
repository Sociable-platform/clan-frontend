import { contrastRatio, HEX_PATTERN, pickOnColor, shade, toRgba } from './color.js';
import { fontStack } from './fonts.js';
import { slotTexture } from './textures.js';

const PALETTES = {
  dark: { bg: '#141D1F', surface: '#1B2628', surface2: '#26363A', text: '#E8ECED', muted: '#B7C5C8', border: '#2C3B3E', frame: '#2C3B3E' },
  light: { bg: '#FFFFFF', surface: '#F2F3F1', surface2: '#E3E5E0', text: '#000000', muted: '#5B5D56', border: '#D9DBD5', frame: '#D9DBD5' },
};

const DEFAULT_BRAND = '#80EAFF';
const RADIUS_BY_CORNERS = { square: 0, soft: 8, round: 16, chamfer: 0 };
const NAME_CONTRAST_MIN = 3;

const color = (value, fallback) => (typeof value === 'string' && HEX_PATTERN.test(value) ? value.toUpperCase() : fallback);
const oneOf = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const clamp = (value, min, max, fallback) => (Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback);

const chamfer = (size) =>
  `polygon(${size}px 0, calc(100% - ${size}px) 0, 100% ${size}px, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, ${size}px 100%, 0 calc(100% - ${size}px), 0 ${size}px)`;

function frameOf(style, frameColor, width) {
  const high = shade(frameColor, 0.35);
  const low = shade(frameColor, -0.35);
  if (style === 'none') return { style: 'none', width: '0px', color: 'transparent' };
  if (style === 'double') return { style: 'double', width: `${Math.max(3, width)}px`, color: frameColor };
  if (style === 'bevel') return { style: 'solid', width: `${width}px`, color: `${high} ${low} ${low} ${high}` };
  if (style === 'inset') return { style: 'solid', width: `${width}px`, color: `${low} ${high} ${high} ${low}` };
  return { style: 'solid', width: `${width}px`, color: frameColor };
}

function buttonOf(style, brand, onBrand, text, buttonTexture) {
  if (style === 'outline') return { bg: 'transparent', image: 'none', fg: text, width: '2px', color: brand };
  if (style === 'bevel') {
    const high = shade(brand, 0.3);
    const low = shade(brand, -0.4);
    return { bg: brand, image: buttonTexture, fg: onBrand, width: '1px 1px 4px 1px', color: `${high} ${low} ${low} ${high}` };
  }
  return { bg: brand, image: buttonTexture, fg: onBrand, width: '0px', color: 'transparent' };
}

const BORDER_STYLES = ['none', 'solid', 'double', 'bevel', 'inset'];

/** Which CSS variable family each part of `theme.components` fills (`--sk-<prefix>-bg`, `-fg`, `-border-*`, `-radius`, `-clip`). */
const PART_PREFIXES = {
  bubbleMine: 'bubble-mine',
  bubbleTheirs: 'bubble-theirs',
  button: 'btn',
  buttonSecondary: 'btn2',
  tab: 'tab',
  tabSelected: 'tab-on',
  row: 'row',
};

/**
 * Variables for one part's overrides. Only what the config sets is emitted, so everything else keeps the
 * look the theme gives it (the stylesheet falls back to it). Colors must be `#RRGGBB`, the border style comes
 * from a list, the width and radius are rounded and clamped; a border is drawn as soon as any of its three
 * fields is set (missing ones default to a solid 1px line in the theme's border color).
 */
function partVars(prefix, part, defaultBorderColor) {
  if (part === null || typeof part !== 'object') return {};
  const vars = {};
  const name = (suffix) => `--sk-${prefix}-${suffix}`;

  const background = color(part.background, null);
  const text = color(part.text, null);
  if (background) vars[name('bg')] = background;
  if (text) vars[name('fg')] = text;

  const hasBorder = ['borderStyle', 'borderWidth', 'borderColor'].some((key) => part[key] !== undefined);
  if (hasBorder) {
    const style = oneOf(part.borderStyle, BORDER_STYLES, 'solid');
    const width = Math.round(clamp(part.borderWidth, 1, 8, 1));
    const border = frameOf(style, color(part.borderColor, defaultBorderColor), width);
    vars[name('border-style')] = border.style;
    vars[name('border-width')] = border.width;
    vars[name('border-color')] = border.color;
  }

  if (Number.isFinite(part.radius)) {
    vars[name('radius')] = `${Math.round(clamp(part.radius, 0, 24, 0))}px`;
    vars[name('clip')] = 'none';
  }
  return vars;
}

/**
 * Turn the config's `theme` and `layout` into CSS custom properties for the panel. Every value is
 * checked or looked up here (hex colors by pattern, fonts and textures by id, numbers clamped), so
 * a bad value falls back to a default and nothing from the config is ever used as markup or CSS text.
 */
export function resolveTheme(config, assets) {
  const theme = config?.theme ?? {};
  const mode = theme.mode === 'light' ? 'light' : 'dark';
  const base = PALETTES[mode];
  const colors = theme.colors ?? {};

  const brand = color(colors.brand, DEFAULT_BRAND);
  const bg = color(colors.background, base.bg);
  const surface = color(colors.surface, base.surface);
  const text = color(colors.text, base.text);
  const muted = color(colors.muted, base.muted);
  const onBrand = pickOnColor(brand);

  const onSurface = mode === 'dark' ? ['rgba(255,255,255,.06)', 'rgba(255,255,255,.04)'] : ['rgba(0,0,0,.05)', 'rgba(0,0,0,.035)'];
  const onBrandLines = ['rgba(255,255,255,.16)', 'rgba(0,0,0,.10)'];
  const textures = theme.textures ?? {};

  const corners = oneOf(theme.frame?.corners, Object.keys(RADIUS_BY_CORNERS), 'soft');
  const radius = RADIUS_BY_CORNERS[corners];
  const frameStyle = oneOf(theme.frame?.style, ['none', 'solid', 'double', 'bevel', 'inset'], 'solid');
  const frameWidth = Math.round(clamp(theme.frame?.width, 1, 8, 1));
  const frame = frameOf(frameStyle, color(theme.frame?.color, base.frame), frameWidth);
  const isChamfer = corners === 'chamfer';

  const upper = theme.buttons?.case === 'upper';
  const button = buttonOf(
    oneOf(theme.buttons?.style, ['filled', 'outline', 'bevel'], 'filled'),
    brand,
    onBrand,
    text,
    slotTexture(textures.button, assets, onBrandLines, brand),
  );

  const opacity = clamp(theme.panel?.opacity, 0.5, 1, 1);

  const vars = {
    '--sk-brand': brand,
    '--sk-on-brand': onBrand,
    '--sk-bg': bg,
    '--sk-surface': surface,
    '--sk-surface2': base.surface2,
    '--sk-text': text,
    '--sk-muted': muted,
    '--sk-border': base.border,
    '--sk-name-mine': contrastRatio(brand, bg) >= NAME_CONTRAST_MIN ? brand : text,
    '--sk-radius': `${radius}px`,
    '--sk-radius-sm': `${Math.max(0, radius - 2)}px`,
    '--sk-font-body': fontStack(theme.fonts?.body?.family),
    '--sk-font-head': fontStack(theme.fonts?.heading?.family),
    '--sk-panel-bg': toRgba(bg, opacity),
    '--sk-panel-blur': theme.panel?.blur === true ? 'blur(10px)' : 'none',
    '--sk-tex-panel': slotTexture(textures.panel, assets, onSurface, bg),
    '--sk-tex-content': slotTexture(textures.content, assets, onSurface, bg),
    '--sk-tex-bubble-mine': slotTexture(textures.bubble, assets, onBrandLines, brand),
    '--sk-tex-bubble-theirs': slotTexture(textures.bubble, assets, onSurface, surface),
    '--sk-frame-style': frame.style,
    '--sk-frame-width': frame.width,
    '--sk-frame-color': frame.color,
    '--sk-frame-clip': isChamfer ? chamfer(14) : 'none',
    '--sk-btn-bg': button.bg,
    '--sk-btn-image': button.image,
    '--sk-btn-fg': button.fg,
    '--sk-btn-border-width': button.width,
    '--sk-btn-border-color': button.color,
    '--sk-btn-case': upper ? 'uppercase' : 'none',
    '--sk-btn-spacing': upper ? '0.06em' : 'normal',
    '--sk-btn-clip': isChamfer ? chamfer(6) : 'none',
  };

  Object.entries(PART_PREFIXES).forEach(([part, prefix]) => {
    Object.assign(vars, partVars(prefix, theme.components?.[part], base.border));
  });

  return {
    vars,
    position: oneOf(config?.layout?.position, ['bottom-left', 'bottom-right'], 'bottom-right'),
  };
}
