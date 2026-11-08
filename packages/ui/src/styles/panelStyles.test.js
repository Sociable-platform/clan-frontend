import { describe, expect, it } from 'vitest';

import { PANEL_CSS } from './panelStyles.js';

describe('panel stylesheet', () => {
  it('sizes the widget by its container, never by the window', () => {
    // A preview box shorter than the window would otherwise cut the widget off at the top.
    expect(PANEL_CSS).not.toMatch(/\d(vh|vw|vmin|vmax|svh|dvh)\b/);
  });

  it('lets the dock and the panel shrink to fit the container', () => {
    expect(PANEL_CSS).toMatch(/\.sk-dock \{[^}]*max-height: calc\(100% - 32px\)/);
    expect(PANEL_CSS).toMatch(/\.sk-panel \{[^}]*flex: 0 1 520px[^}]*min-height: 0/);
  });
});
