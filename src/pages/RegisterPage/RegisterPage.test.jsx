import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerDeveloper } from '@/features/auth/api/authApi';
import { ApiError } from '@/shared/api';
import { AUTH_STATUS, useAuthStore } from '@/store';
import { buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { RegisterPage } from './RegisterPage';

vi.mock('@/features/auth/api/authApi');

function renderRegister() {
  useAuthStore.setState({ status: AUTH_STATUS.UNAUTHENTICATED });
  return renderWithRouter(
    [
      { path: '/register', element: <RegisterPage /> },
      { path: '/login', element: <p>Login page</p> },
    ],
    { initialEntries: ['/register'] },
  );
}

async function fillAndSubmit({ name = 'Dev One', email = 'dev@example.com', password = 'correct horse' }) {
  const user = userEvent.setup();
  if (name) await user.type(screen.getByLabelText('Name'), name);
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText(/^Password/), password);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('validates the fields before calling the server', async () => {
    renderRegister();

    await fillAndSubmit({ name: '', email: 'not-an-email', password: 'short' });

    expect(screen.getByText('Enter your name')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument();
    expect(registerDeveloper).not.toHaveBeenCalled();
  });

  it('shows a taken email on the email field', async () => {
    registerDeveloper.mockRejectedValue(
      new ApiError({ status: 409, code: 'email_taken', message: 'An account with this email already exists' }),
    );
    renderRegister();

    await fillAndSubmit({});

    const email = screen.getByLabelText('Email');
    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument();
    expect(email).toBeInvalid();
  });

  it('sends the developer to the login page after the account is created', async () => {
    registerDeveloper.mockResolvedValue(buildDeveloper());
    renderRegister();

    await fillAndSubmit({});

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED);
  });
});
