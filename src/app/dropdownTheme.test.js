import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.css'), 'utf8');
const rule = (selector) => css.match(new RegExp(`${selector.replace(/[.[\]]/g, '\\$&')}[^{]*\\{([^}]*)\\}`))?.[1] ?? '';

// The open list of a <select> is drawn by the browser on the select's own background, which is a translucent
// tint, so without these rules it can show light text on a white list in the dark theme.
describe('dropdown lists follow the theme', () => {
  it('tells the browser which color scheme each theme uses', () => {
    expect(rule(':root')).toMatch(/color-scheme: light/);
    expect(rule(":root[data-theme='dark']")).toMatch(/color-scheme: dark/);
  });

  it('gives the options a solid background and the theme text color', () => {
    const options = rule('.field-select option');

    expect(options).toMatch(/background-color: var\(--card\)/);
    expect(options).toMatch(/color: var\(--foreground\)/);
  });
});
