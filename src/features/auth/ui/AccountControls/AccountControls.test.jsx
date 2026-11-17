import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_STATUS, readStoredSession, ROLES, useAuthStore } from '@/store';
import { buildAdmin, buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { logoutDeveloper } from '../../api/authApi';

import { AccountControls } from './AccountControls';

vi.mock('../../api/authApi');

function signIn(developer = buildDeveloper()) {
  useAuthStore.getState().startSession({ token: 'abc', expiresAt: Date.now() + 60_000, developer });
}

describe('AccountControls', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

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
    // An admin has no session on the server to end.
    expect(logoutDeveloper).not.toHaveBeenCalled();
  });

  it('falls back to the email when the developer has no name', async () => {
    signIn(buildDeveloper({ name: '' }));
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);

    expect(screen.getByRole('button', { name: 'Account menu, dev@example.com' })).toBeInTheDocument();
  });

  it('log out ends the session on the server, then clears the store and what is stored', async () => {
    const user = userEvent.setup();
    logoutDeveloper.mockResolvedValue(undefined);
    signIn();
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);
    expect(readStoredSession()).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Account menu, Dev One' }));
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));

    expect(logoutDeveloper).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(useAuthStore.getState()).toMatchObject({
        status: AUTH_STATUS.UNAUTHENTICATED,
        token: null,
        developer: null,
      }),
    );
    expect(readStoredSession()).toBeNull();
    // Signed out, the account button is gone.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('logs out here even when the server cannot be reached', async () => {
    const user = userEvent.setup();
    logoutDeveloper.mockRejectedValue(new Error('offline'));
    signIn();
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);

    await user.click(screen.getByRole('button', { name: 'Account menu, Dev One' }));
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));

    await waitFor(() => expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED));
    expect(readStoredSession()).toBeNull();
  });

  it('shows no account button when signed out', () => {
    useAuthStore.getState().clearSession();
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows nothing while the session is being restored', () => {
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);

    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.INITIALIZING);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
