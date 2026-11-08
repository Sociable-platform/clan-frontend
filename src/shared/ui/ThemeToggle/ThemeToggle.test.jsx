import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyTheme, THEMES } from '@/shared/theme/theme';

import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => applyTheme(THEMES.LIGHT));
  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('shows which theme is on', () => {
    render(<ThemeToggle />);

    expect(screen.getByRole('group', { name: 'Color theme' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches the whole page to dark and remembers it', async () => {
    render(<ThemeToggle />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Dark theme' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('clan.dashboard.theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches back to light', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Dark theme' }));
    await user.click(screen.getByRole('button', { name: 'Light theme' }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('clan.dashboard.theme')).toBe('light');
  });

  it('starts on dark when the page is already dark', () => {
    applyTheme(THEMES.DARK);

    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true');
  });
});
