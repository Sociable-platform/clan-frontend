import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.css'), 'utf8');

// Custom properties that are not in the stylesheet because something sets them while the app runs: Radix
// puts the --radix-* sizes on its menus, and these two come from inline styles of the components that use them.
const SET_AT_RUNTIME = new Set([
  '--choice-columns',
  '--texture-image',
  '--radix-dropdown-menu-content-available-height',
  '--radix-dropdown-menu-trigger-width',
]);

const used = [...css.matchAll(/var\((--[a-zA-Z0-9-]+)\s*[,)]/g)].map((match) => match[1]);
const defined = new Set([...css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((match) => match[1]));

// A var() of a token nobody defined is not an error in CSS: the declaration is dropped. A gap or a padding then
// silently becomes zero, which is how a form once had its input touching its button (var(--space-3) was not in the
// scale). So every token the stylesheet uses has to be defined, here or at runtime.
describe('design tokens', () => {
  it('defines every custom property the stylesheet uses', () => {
    const missing = [...new Set(used)].filter((name) => !defined.has(name) && !SET_AT_RUNTIME.has(name));

    expect(missing).toEqual([]);
  });

  it('has the whole spacing scale, with no step missing', () => {
    for (const step of [1, 2, 3, 4, 6]) expect(defined.has(`--space-${step}`)).toBe(true);
  });

  it('does not list a runtime token the stylesheet no longer uses', () => {
    for (const name of SET_AT_RUNTIME) expect(used).toContain(name);
  });
});
