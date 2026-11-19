import { describe, expect, it } from 'vitest';

import { readStyles } from './readStyles';

const css = readStyles();
const rule = (selector) => css.match(new RegExp(`${selector.replace(/[.[\]]/g, '\\$&')}[^{]*\\{([^}]*)\\}`))?.[1] ?? '';

// Every dropdown is a button that opens the app's own menu (SelectField, the account and Clan menus), drawn
// with theme tokens, so its list never shows light text on a white list in the dark theme. The color scheme
// still tells the browser how to draw what it draws itself (scrollbars, date pickers).
describe('dropdown lists follow the theme', () => {
  it('tells the browser which color scheme each theme uses', () => {
    expect(rule(':root')).toMatch(/color-scheme: light/);
    expect(rule(":root[data-theme='dark']")).toMatch(/color-scheme: dark/);
  });

  it('draws the open list on a solid background in the theme text color', () => {
    // The rule for the menu itself, not .user-menu-trigger or .user-menu-item.
    const menu = css.match(/\n\.user-menu \{([^}]*)\}/)?.[1] ?? '';

    expect(menu).toMatch(/background: var\(--card\)/);
    expect(menu).toMatch(/color: var\(--foreground\)/);
  });

  it('opens a select field\'s list above a dialog and as wide as its button', () => {
    const list = rule('.field-select-menu');

    expect(list).toMatch(/z-index: 60/);
    expect(list).toMatch(/min-width: var\(--radix-dropdown-menu-trigger-width\)/);
  });
});
