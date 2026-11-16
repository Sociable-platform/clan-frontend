import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestPasswordReset } from '@/features/auth/api/authApi';
import { ApiError } from '@/shared/api';
import { AUTH_STATUS, useAuthStore } from '@/store';
import { renderWithRouter } from '@/test/renderWithRouter';

import { ForgotPasswordPage } from './ForgotPasswordPage';

vi.mock('@/features/auth/api/authApi');

function renderForgot(entry = '/forgot-password') {
  useAuthStore.setState({ status: AUTH_STATUS.UNAUTHENTICATED });
  return renderWithRouter(
    [
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/login', element: <p>Login page</p> },
    ],
    { initialEntries: [entry] },
  );
}

async function submit(email) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText('Email'), email);
  await user.click(screen.getByRole('button', { name: 'Send reset link' }));
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('validates the email before calling the server', async () => {
    renderForgot();

    await submit('not-an-email');

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('asks the server for a link and says where it went', async () => {
    requestPasswordReset.mockResolvedValue(undefined);
    renderForgot();

    await submit('dev@example.com');

    expect(requestPasswordReset).toHaveBeenCalledWith({ email: 'dev@example.com' });
    expect(await screen.findByRole('status')).toHaveTextContent('If an account exists for dev@example.com');
    expect(screen.queryByRole('button', { name: 'Send reset link' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to log in' })).toHaveAttribute('href', '/login');
  });

  it('starts with the email typed on the login page', () => {
    renderForgot({ pathname: '/forgot-password', state: { email: 'dev@example.com' } });

    expect(screen.getByLabelText('Email')).toHaveValue('dev@example.com');
  });

  it('shows too many attempts as a form error', async () => {
    requestPasswordReset.mockRejectedValue(
      new ApiError({ status: 429, code: 'rate_limited', message: 'Too many attempts. Try again in a few minutes.' }),
    );
    renderForgot();

    await submit('dev@example.com');

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts');
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeEnabled();
  });

  it('puts an address the server refuses on the email field', async () => {
    requestPasswordReset.mockRejectedValue(
      new ApiError({ status: 400, code: 'invalid_email', message: 'Email address is not valid' }),
    );
    renderForgot();

    await submit('dev@example.com');

    expect(await screen.findByText('Email address is not valid')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInvalid();
  });
});
