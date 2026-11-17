import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyTheme, THEMES } from '@/shared/theme/theme';

import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => applyTheme(THEMES.LIGHT));
  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('offers the dark theme while the page is light', () => {
    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
  });

  it('switches the whole page to dark and remembers it', async () => {
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('clan.dashboard.theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });

  it('switches back to light', async () => {
    applyTheme(THEMES.DARK);
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('clan.dashboard.theme')).toBe('light');
  });
});
