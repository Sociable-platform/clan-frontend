import { describe, expect, it } from 'vitest';

import { loadExample } from '../testUtils.js';
import { contrastRatio, pickOnColor, shade, toRgba } from './color.js';
import { fontStack, googleFontsHref } from './fonts.js';
import { resolveTheme } from './theme.js';

describe('resolveTheme', () => {
  it('maps the arena example to the panel variables', () => {
    const { vars, position } = resolveTheme(loadExample('valid/arena.json'));

    expect(position).toBe('bottom-right');
    expect(vars['--sk-brand']).toBe('#80EAFF');
    expect(vars['--sk-on-brand']).toBe('#14161B');
    expect(vars['--sk-bg']).toBe('#141D1F');
    expect(vars['--sk-font-head']).toBe("'Unbounded', sans-serif");
    expect(vars['--sk-font-body']).toBe("'Inter', sans-serif");
    expect(vars['--sk-radius']).toBe('8px');
    expect(vars['--sk-radius-sm']).toBe('6px');
    expect(vars['--sk-panel-bg']).toBe('rgba(20, 29, 31, 1)');
    expect(vars['--sk-tex-panel']).toContain('repeating-linear-gradient');
    expect(vars['--sk-tex-content']).toBe('none');
    expect(vars['--sk-frame-style']).toBe('solid');
    expect(vars['--sk-btn-bg']).toBe('#80EAFF');
  });

  it('uses the light palette and its own frame color for a light config', () => {
    const { vars } = resolveTheme(loadExample('valid/farm-minimal.json'));

    expect(vars['--sk-bg']).toBe('#FFFFFF');
    expect(vars['--sk-border']).toBe('#D9DBD5');
  });

  it.each([
    ['solid', 'solid', '1px', '#2C3B3E'],
    ['none', 'none', '0px', 'transparent'],
    ['double', 'double', '3px', '#2C3B3E'],
  ])('draws a %s frame', (style, cssStyle, width, frameColor) => {
    const config = loadExample('valid/arena.json');
    config.theme.frame.style = style;
    config.theme.frame.width = 1;

    const { vars } = resolveTheme(config);

    expect(vars['--sk-frame-style']).toBe(cssStyle);
    expect(vars['--sk-frame-width']).toBe(width);
    expect(vars['--sk-frame-color']).toBe(frameColor);
  });

  it('gives bevel and inset frames four edge colors', () => {
    const config = loadExample('valid/arena.json');
    config.theme.frame.style = 'bevel';

    expect(resolveTheme(config).vars['--sk-frame-color'].split(' ')).toHaveLength(4);
  });

  it('cuts the corners of the panel and the buttons for chamfer', () => {
    const config = loadExample('valid/arena.json');
    config.theme.frame.corners = 'chamfer';

    const { vars } = resolveTheme(config);

    expect(vars['--sk-radius']).toBe('0px');
    expect(vars['--sk-frame-clip']).toContain('polygon(14px 0');
    expect(vars['--sk-btn-clip']).toContain('polygon(6px 0');
  });

  it('styles buttons: outline uses the brand as border, upper cases the text', () => {
    const config = loadExample('valid/arena.json');
    config.theme.buttons = { style: 'outline', case: 'upper' };

    const { vars } = resolveTheme(config);

    expect(vars['--sk-btn-bg']).toBe('transparent');
    expect(vars['--sk-btn-border-width']).toBe('2px');
    expect(vars['--sk-btn-border-color']).toBe('#80EAFF');
    expect(vars['--sk-btn-case']).toBe('uppercase');
  });

  it('blurs the panel and applies its opacity', () => {
    const config = loadExample('valid/arena.json');
    config.theme.panel = { opacity: 0.8, blur: true };

    const { vars } = resolveTheme(config);

    expect(vars['--sk-panel-blur']).toBe('blur(10px)');
    expect(vars['--sk-panel-bg']).toBe('rgba(20, 29, 31, 0.8)');
  });

  it('places the dock on the left when asked', () => {
    const config = loadExample('valid/arena.json');
    config.layout.position = 'bottom-left';

    expect(resolveTheme(config).position).toBe('bottom-left');
  });

  it('falls back to defaults for missing or invalid values', () => {
    const { vars, position } = resolveTheme({ theme: { colors: { brand: 'red', text: '#12' }, panel: { opacity: 7 }, frame: { width: 99 } }, layout: { position: 'top' } });

    expect(vars['--sk-brand']).toBe('#80EAFF');
    expect(vars['--sk-text']).toBe('#E8ECED');
    expect(vars['--sk-panel-bg']).toBe('rgba(20, 29, 31, 1)');
    expect(vars['--sk-frame-width']).toBe('8px');
    expect(position).toBe('bottom-right');
    expect(resolveTheme(undefined).vars['--sk-bg']).toBe('#141D1F');
  });
});

describe('color helpers', () => {
  it('picks readable text for a brand color', () => {
    expect(pickOnColor('#80EAFF')).toBe('#14161B');
    expect(pickOnColor('#2F6BFF')).toBe('#FFFFFF');
  });

  it('computes contrast, shading and rgba', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(shade('#808080', 0.5)).toBe('#C0C0C0');
    expect(shade('#808080', -0.5)).toBe('#404040');
    expect(toRgba('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });
});

describe('fonts', () => {
  it('uses a generic fallback by category and the default for unknown names', () => {
    expect(fontStack('Press Start 2P')).toBe("'Press Start 2P', monospace");
    expect(fontStack('Cinzel')).toBe("'Cinzel', serif");
    expect(fontStack("x'; } body { display: none")).toBe("'Inter', sans-serif");
    expect(fontStack(undefined)).toBe("'Inter', sans-serif");
  });

  it('builds the Google Fonts link for the two families only', () => {
    const href = googleFontsHref(loadExample('valid/arena.json'));

    expect(href).toBe('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
    expect(googleFontsHref({ theme: { fonts: { heading: { family: 'Inter' }, body: { family: 'Inter' } } } })).toContain('family=Inter');
  });
});
