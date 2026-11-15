import { describe, expect, it } from 'vitest';

import { loadExample } from '../testUtils.js';
import { resolveTheme } from '../theme/theme.js';
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

  it('scrolls only the message list, so a long chat does not push its header out of view', () => {
    expect(PANEL_CSS).toMatch(/\.sk-chat \{[^}]*flex: 1 1 0[^}]*min-height: 120px[^}]*overflow-y: auto/);
    // The newest message sits a little above the message box when scrolled to the end.
    expect(PANEL_CSS).toMatch(/\.sk-chat \{[^}]*padding-bottom: 12px/);
  });

  it('draws scrollbars in the widget\'s colours', () => {
    expect(PANEL_CSS).toMatch(/scrollbar-color: var\(--sk-border\) transparent/);
  });

  it('keeps a gap between the message box and the counter under it', () => {
    expect(PANEL_CSS).toMatch(/\.sk-composer \+ \.sk-meta \{[^}]*margin-top: 8px/);
  });

  it('uses every variable the component styles set, so no setting is silently ignored', () => {
    const { vars } = resolveTheme(loadExample('valid/styled-parts.json'));
    const unused = Object.keys(vars).filter((name) => !name.endsWith('-clip') || name === '--sk-btn-clip').filter((name) => !PANEL_CSS.includes(name));

    expect(unused).toEqual([]);
  });
});
