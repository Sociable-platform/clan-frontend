import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { confirmPasswordReset } from '@/features/auth/api/authApi';
import { ApiError } from '@/shared/api';
import { AUTH_STATUS, ROLES, useAuthStore } from '@/store';
import { buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { ResetPasswordPage } from './ResetPasswordPage';

vi.mock('@/features/auth/api/authApi');

function LoginStub() {
  return <p>Login page</p>;
}

function renderReset(entry = '/reset-password#token=tok-123') {
  return renderWithRouter(
    [
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/login', element: <LoginStub /> },
      { path: '/forgot-password', element: <p>Forgot page</p> },
    ],
    { initialEntries: [entry] },
  );
}

async function submit(password, repeat = password) {
  const user = userEvent.setup();
  if (password) await user.type(screen.getByLabelText(/^New password/), password);
  if (repeat) await user.type(screen.getByLabelText('Repeat the new password'), repeat);
  await user.click(screen.getByRole('button', { name: 'Change password' }));
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({ status: AUTH_STATUS.UNAUTHENTICATED, token: null, role: null, developer: null });
  });

  it('takes the token out of the address bar', async () => {
    const router = renderReset();

    await waitFor(() => expect(router.state.location.hash).toBe(''));
    expect(router.state.location.pathname).toBe('/reset-password');
    expect(screen.getByRole('button', { name: 'Change password' })).toBeInTheDocument();
  });

  it('says the link is not valid when it has no token', () => {
    renderReset('/reset-password');

    expect(screen.getByRole('alert')).toHaveTextContent('This reset link is not valid');
    expect(screen.queryByRole('button', { name: 'Change password' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ask for a new link' })).toHaveAttribute('href', '/forgot-password');
  });

  it('validates the two passwords before calling the server', async () => {
    renderReset();

    await submit('short');
    expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText(/^New password/));
    await user.clear(screen.getByLabelText('Repeat the new password'));
    await submit('a brand new one', 'a brand new two');
    expect(screen.getByText('The two passwords are not the same')).toBeInTheDocument();
    expect(confirmPasswordReset).not.toHaveBeenCalled();
  });

  it('changes the password with the token of the link and goes to the login page', async () => {
    confirmPasswordReset.mockResolvedValue(undefined);
    const router = renderReset();

    await submit('a brand new one');

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(confirmPasswordReset).toHaveBeenCalledWith({ token: 'tok-123', password: 'a brand new one' });
    expect(router.state.location.state).toEqual({
      notice: 'Password changed. Log in with your new password.',
    });
  });

  it('drops a developer session of this browser after the reset', async () => {
    confirmPasswordReset.mockResolvedValue(undefined);
    renderReset();
    useAuthStore.setState({
      status: AUTH_STATUS.AUTHENTICATED,
      token: 'old-token',
      role: ROLES.DEVELOPER,
      developer: buildDeveloper(),
    });

    await submit('a brand new one');

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('shows a used or expired link as a form error and stays on the page', async () => {
    confirmPasswordReset.mockRejectedValue(
      new ApiError({
        status: 400,
        code: 'invalid_reset_token',
        message: 'This reset link is not valid or has expired. Ask for a new one.',
      }),
    );
    renderReset();

    await submit('a brand new one');

    expect(await screen.findByRole('alert')).toHaveTextContent('not valid or has expired');
    expect(screen.getByRole('button', { name: 'Change password' })).toBeEnabled();
  });

  it('puts a password the server refuses on its field', async () => {
    confirmPasswordReset.mockRejectedValue(
      new ApiError({ status: 400, code: 'invalid_password', message: 'Password must be 8 to 72 characters' }),
    );
    renderReset();

    await submit('a brand new one');

    expect(await screen.findByText('Password must be 8 to 72 characters')).toBeInTheDocument();
    expect(screen.getByLabelText(/^New password/)).toBeInvalid();
  });
});
