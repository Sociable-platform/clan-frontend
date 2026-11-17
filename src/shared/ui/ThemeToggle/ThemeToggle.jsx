import { THEMES, useTheme } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';

/**
 * The light / dark switch in the header: one icon button that shows the theme on screen (a sun
 * in light, a moon in dark) and changes to the other one when pressed. The choice is remembered
 * in this browser. Its name says what pressing it does, for screen readers and the tooltip.
 */
export function ThemeToggle() {
  const { theme, selectTheme } = useTheme();
  const isDark = theme === THEMES.DARK;
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      className="header-icon-button"
      aria-label={label}
      title={label}
      onClick={() => selectTheme(isDark ? THEMES.LIGHT : THEMES.DARK)}
    >
      <Icon name={isDark ? 'moon' : 'sun'} />
    </button>
  );
}
