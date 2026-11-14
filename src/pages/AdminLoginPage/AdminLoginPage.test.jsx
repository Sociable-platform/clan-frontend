import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GuestOnly, RequireRole } from '@/features/auth';
import {
  getCurrentAdmin,
  getCurrentDeveloper,
  loginAdmin,
  loginDeveloper,
} from '@/features/auth/api/authApi';
import { ApiError } from '@/shared/api';
import { AUTH_STATUS, readStoredSession, ROLES, useAuthStore } from '@/store';
import { buildAdmin, buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { AdminLoginPage } from './AdminLoginPage';

vi.mock('@/features/auth/api/authApi');

function renderAdminArea(entry = '/admin/login') {
  return renderWithRouter(
    [
      { element: <GuestOnly role={ROLES.ADMIN} />, children: [{ path: '/admin/login', element: <AdminLoginPage /> }] },
      {
        element: <RequireRole role={ROLES.ADMIN} stealth notFound={<p>Page not found</p>} />,
        children: [{ path: '/admin/developers', element: <p>Developers page</p> }],
      },
    ],
    { initialEntries: [entry] },
  );
}

async function submit(email, password) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({ status: AUTH_STATUS.UNAUTHENTICATED });
  });

  it('is titled for admins and has no register link', () => {
    renderAdminArea();

    expect(screen.getByRole('heading', { name: 'Admin sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Register' })).not.toBeInTheDocument();
  });

  it('logs in through the admin endpoints and lands on the developers page', async () => {
    loginAdmin.mockResolvedValue({ token: 'adm', expiresAt: Date.now() + 60_000 });
    getCurrentAdmin.mockResolvedValue(buildAdmin());
    renderAdminArea();

    await submit('admin@example.com', 'correct horse');

    expect(await screen.findByText('Developers page')).toBeInTheDocument();
    expect(loginDeveloper).not.toHaveBeenCalled();
    expect(getCurrentAdmin).toHaveBeenCalledWith({ token: 'adm' });
    expect(useAuthStore.getState()).toMatchObject({ status: AUTH_STATUS.AUTHENTICATED, role: ROLES.ADMIN });
    expect(readStoredSession()).toMatchObject({ token: 'adm', role: ROLES.ADMIN });
  });

  it('replaces a developer session when an admin logs in', async () => {
    useAuthStore
      .getState()
      .startSession({ token: 'dev', expiresAt: Date.now() + 60_000, developer: buildDeveloper() });
    loginAdmin.mockResolvedValue({ token: 'adm', expiresAt: Date.now() + 60_000 });
    getCurrentAdmin.mockResolvedValue(buildAdmin());
    renderAdminArea();

    // A developer is not an admin yet, so the sign-in form is still shown to them.
    await submit('admin@example.com', 'correct horse');

    expect(await screen.findByText('Developers page')).toBeInTheDocument();
    expect(getCurrentDeveloper).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ token: 'adm', role: ROLES.ADMIN, developer: null });
    expect(readStoredSession()).toMatchObject({ token: 'adm', role: ROLES.ADMIN });
  });

  it('shows a wrong password as a form error and starts no session', async () => {
    loginAdmin.mockRejectedValue(
      new ApiError({ status: 401, code: 'invalid_credentials', message: 'Email or password is wrong' }),
    );
    renderAdminArea();

    await submit('admin@example.com', 'nope');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is wrong');
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED);
  });

  it('shows validation errors without calling the server', async () => {
    const user = userEvent.setup();
    renderAdminArea();

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    expect(loginAdmin).not.toHaveBeenCalled();
  });

  it('a guest opening an admin page sees the 404 page, not the login', () => {
    renderAdminArea('/admin/developers');

    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
