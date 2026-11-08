import { afterEach, describe, expect, it, vi } from 'vitest';

import { applyTheme, DEFAULT_THEME, getAppliedTheme, initTheme, readStoredTheme, storeTheme, THEMES } from './theme';

describe('theme', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to light', () => {
    expect(DEFAULT_THEME).toBe(THEMES.LIGHT);
  });

  it('remembers the chosen theme', () => {
    storeTheme(THEMES.DARK);

    expect(readStoredTheme()).toBe(THEMES.DARK);
  });

  it('ignores a stored value that is not a theme', () => {
    window.localStorage.setItem('clan.dashboard.theme', 'purple');

    expect(readStoredTheme()).toBeNull();
  });

  it('puts the theme on <html>', () => {
    applyTheme(THEMES.DARK);

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(getAppliedTheme()).toBe(THEMES.DARK);
  });

  it('starts light when nothing was chosen, and dark when dark was chosen before', () => {
    initTheme();
    expect(getAppliedTheme()).toBe(THEMES.LIGHT);

    storeTheme(THEMES.DARK);
    initTheme();
    expect(getAppliedTheme()).toBe(THEMES.DARK);
  });

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(readStoredTheme()).toBeNull();
    expect(() => storeTheme(THEMES.DARK)).not.toThrow();
    initTheme();
    expect(getAppliedTheme()).toBe(THEMES.LIGHT);
  });
});
