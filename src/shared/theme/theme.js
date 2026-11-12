// The dashboard is a B2B surface, so Light Mode is the default (see Brand in CLAUDE.md). A choice made
// with the toggle is remembered in this browser. The tokens switch as a whole through
// `data-theme` on <html>, because the brand forbids mixing light and dark palettes.
export const THEMES = { LIGHT: 'light', DARK: 'dark' };
export const DEFAULT_THEME = THEMES.LIGHT;

const STORAGE_KEY = 'clan.dashboard.theme';

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    // Blocked storage (private mode, disabled site data): the choice lasts until reload.
    return null;
  }
}

const isTheme = (value) => Object.values(THEMES).includes(value);

/** The remembered theme, or null when none was chosen or storage is unavailable. */
export function readStoredTheme() {
  try {
    const stored = getStorage()?.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme) {
  try {
    getStorage()?.setItem(STORAGE_KEY, theme);
  } catch {
    // Not remembered; the theme still applies for this visit.
  }
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

/** What the page is showing right now (set by `applyTheme` at startup). */
export function getAppliedTheme() {
  return document.documentElement.dataset.theme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
}

/** Applies the remembered theme, or the default. Call once before the first render. */
export function initTheme() {
  applyTheme(readStoredTheme() ?? DEFAULT_THEME);
}
