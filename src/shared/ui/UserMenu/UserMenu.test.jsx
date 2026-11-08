import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyTheme, THEMES } from '@/shared/theme/theme';

import { UserMenu } from './UserMenu';

function renderMenu(props = {}) {
  const onLogout = vi.fn();
  render(
    <MemoryRouter>
      <UserMenu
        accountLabel="Dev One"
        accountDetail="dev@example.com"
        items={[{ key: 'logout', label: 'Log out', icon: 'logOut', onSelect: onLogout }]}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onLogout, user: userEvent.setup() };
}

const openMenu = (user, name = 'Account menu, Dev One') => user.click(screen.getByRole('button', { name }));

describe('UserMenu', () => {
  beforeEach(() => applyTheme(THEMES.LIGHT));
  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('is one button that names the account and keeps the menu closed', () => {
    renderMenu();

    expect(screen.getByRole('button', { name: 'Account menu, Dev One' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens with who is signed in, the theme choice and the actions', async () => {
    const { user } = renderMenu();

    await openMenu(user);

    const menu = screen.getByRole('menu');
    expect(menu).toHaveTextContent('Dev One');
    expect(menu).toHaveTextContent('dev@example.com');
    expect(screen.getByRole('menuitemradio', { name: 'Light theme' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Dark theme' })).not.toBeChecked();
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
  });

  it('runs an action and closes', async () => {
    const { user, onLogout } = renderMenu();
    await openMenu(user);

    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('switches the whole page to dark, remembers it and stays open', async () => {
    const { user } = renderMenu();
    await openMenu(user);

    await user.click(screen.getByRole('menuitemradio', { name: 'Dark theme' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('clan.dashboard.theme')).toBe('dark');
    expect(screen.getByRole('menuitemradio', { name: 'Dark theme' })).toBeChecked();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('shows dark as chosen when the page is already dark', async () => {
    applyTheme(THEMES.DARK);
    const { user } = renderMenu();

    await openMenu(user);

    expect(screen.getByRole('menuitemradio', { name: 'Dark theme' })).toBeChecked();
  });

  it('offers links as menu items', async () => {
    const { user } = renderMenu({
      accountLabel: null,
      accountDetail: null,
      items: [{ key: 'login', label: 'Log in', icon: 'logIn', to: '/login' }],
    });

    await openMenu(user, 'Account menu');

    expect(screen.getByRole('menuitem', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('closes with Escape and gives focus back to the button', async () => {
    const { user } = renderMenu();
    await openMenu(user);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account menu, Dev One' })).toHaveFocus();
  });

  it('opens from the keyboard and moves through the items with the arrows', async () => {
    const { user } = renderMenu();
    screen.getByRole('button', { name: 'Account menu, Dev One' }).focus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('menuitemradio', { name: 'Light theme' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'Dark theme' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toHaveFocus();
  });
});
