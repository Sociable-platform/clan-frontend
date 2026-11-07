import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GuestOnly } from '@/features/auth';
import { getCurrentDeveloper, loginDeveloper } from '@/features/auth/api/authApi';
import { ApiError } from '@/shared/api';
import { AUTH_STATUS, useAuthStore } from '@/store';
import { buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { LoginPage } from './LoginPage';

vi.mock('@/features/auth/api/authApi');

function renderLogin(entry = '/login') {
  useAuthStore.setState({ status: AUTH_STATUS.UNAUTHENTICATED });
  return renderWithRouter(
    [
      { element: <GuestOnly />, children: [{ path: '/login', element: <LoginPage /> }] },
      { path: '/projects', element: <p>Projects page</p> },
    ],
    { initialEntries: [entry] },
  );
}

async function submit(email, password) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows validation errors without calling the server', async () => {
    renderLogin();

    await submit('', '');

    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(loginDeveloper).not.toHaveBeenCalled();
  });

  it('shows a wrong password as a form error', async () => {
    loginDeveloper.mockRejectedValue(
      new ApiError({ status: 401, code: 'invalid_credentials', message: 'Email or password is wrong' }),
    );
    renderLogin();

    await submit('dev@example.com', 'nope');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is wrong');
  });

  it('shows an unreachable server as a form error', async () => {
    loginDeveloper.mockRejectedValue(
      new ApiError({ status: 0, code: 'network_error', message: 'Cannot reach the server.' }),
    );
    renderLogin();

    await submit('dev@example.com', 'correct horse');

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.');
  });

  it('starts the session and moves on to the page the developer wanted', async () => {
    loginDeveloper.mockResolvedValue({ token: 'abc', expiresAt: Date.now() + 60_000 });
    getCurrentDeveloper.mockResolvedValue(buildDeveloper());
    renderLogin({ pathname: '/login', state: { from: '/projects' } });

    await submit('dev@example.com', 'correct horse');

    expect(await screen.findByText('Projects page')).toBeInTheDocument();
    expect(getCurrentDeveloper).toHaveBeenCalledWith({ token: 'abc' });
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.AUTHENTICATED);
  });

  it('prefills the email and shows the notice carried over from registration', () => {
    renderLogin({
      pathname: '/login',
      state: { notice: 'Account created. Log in to continue.', email: 'new@example.com' },
    });

    expect(screen.getByRole('status')).toHaveTextContent('Account created');
    expect(screen.getByLabelText('Email')).toHaveValue('new@example.com');
  });
});
