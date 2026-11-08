import { THEMES, useTheme } from '@/shared/theme';

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const OPTIONS = [
  {
    theme: THEMES.LIGHT,
    label: 'Light theme',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </Icon>
    ),
  },
  {
    theme: THEMES.DARK,
    label: 'Dark theme',
    icon: (
      <Icon>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </Icon>
    ),
  },
];

/** Light / dark switch for the whole dashboard, shown as two icon buttons; the choice is remembered. */
export function ThemeToggle() {
  const { theme, selectTheme } = useTheme();

  return (
    <div role="group" aria-label="Color theme" className="theme-toggle">
      {OPTIONS.map((option) => (
        <button
          key={option.theme}
          type="button"
          className="theme-toggle-button"
          aria-label={option.label}
          aria-pressed={theme === option.theme}
          onClick={() => selectTheme(option.theme)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
