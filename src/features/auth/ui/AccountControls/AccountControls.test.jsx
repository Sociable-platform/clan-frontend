import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AUTH_STATUS, readStoredSession, ROLES, useAuthStore } from '@/store';
import { buildAdmin, buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { AccountControls } from './AccountControls';

function signIn(developer = buildDeveloper()) {
  useAuthStore.getState().startSession({ token: 'abc', expiresAt: Date.now() + 60_000, developer });
}

describe('AccountControls', () => {
  it('is one account button when signed in, with the name and email in its menu', async () => {
    signIn();
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);

    expect(screen.getAllByRole('button')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Account menu, Dev One' }));

    expect(screen.getByRole('menu')).toHaveTextContent('Dev One');
    expect(screen.getByRole('menu')).toHaveTextContent('dev@example.com');
    expect(screen.getByRole('menuitem', { name: 'Your games' })).toHaveAttribute('href', '/games');
  });

  it('shows the admin when an admin is signed in, and log out clears that session too', async () => {
    const user = userEvent.setup();
    useAuthStore
      .getState()
      .startSession({ token: 'abc', expiresAt: Date.now() + 60_000, role: ROLES.ADMIN, admin: buildAdmin() });
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);

    await user.click(screen.getByRole('button', { name: 'Account menu, Admin One' }));
    expect(screen.getByRole('menu')).toHaveTextContent('admin@example.com');
    expect(screen.queryByRole('menuitem', { name: 'Your games' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));

    expect(useAuthStore.getState()).toMatchObject({ status: AUTH_STATUS.UNAUTHENTICATED, role: null, admin: null });
    expect(readStoredSession()).toBeNull();
  });

  it('falls back to the email when the developer has no name', async () => {
    signIn(buildDeveloper({ name: '' }));
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);

    expect(screen.getByRole('button', { name: 'Account menu, dev@example.com' })).toBeInTheDocument();
  });

  it('log out clears the store and the stored token', async () => {
    const user = userEvent.setup();
    signIn();
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);
    expect(readStoredSession()).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Account menu, Dev One' }));
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));

    expect(useAuthStore.getState()).toMatchObject({
      status: AUTH_STATUS.UNAUTHENTICATED,
      token: null,
      developer: null,
    });
    expect(readStoredSession()).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    expect(screen.getByRole('menuitem', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('offers Log in and Register when signed out', async () => {
    useAuthStore.getState().clearSession();
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);

    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }));

    expect(screen.getByRole('menuitem', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('menuitem', { name: 'Register' })).toHaveAttribute('href', '/register');
  });

  it('shows nothing while the session is being restored', () => {
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);

    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.INITIALIZING);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
