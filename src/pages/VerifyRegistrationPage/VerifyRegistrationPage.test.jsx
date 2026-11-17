import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resendRegistrationCode, verifyRegistration } from '@/features/auth/api/authApi';
import { ApiError } from '@/shared/api';
import { AUTH_STATUS, useAuthStore } from '@/store';
import { buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { VerifyRegistrationPage } from './VerifyRegistrationPage';

vi.mock('@/features/auth/api/authApi');

function renderVerify(state = { email: 'dev@example.com' }) {
  useAuthStore.setState({ status: AUTH_STATUS.UNAUTHENTICATED });
  return renderWithRouter(
    [
      { path: '/register/verify', element: <VerifyRegistrationPage /> },
      { path: '/register', element: <p>Register page</p> },
      { path: '/login', element: <p>Login page</p> },
    ],
    { initialEntries: [{ pathname: '/register/verify', state }] },
  );
}

async function submit(code) {
  const user = userEvent.setup();
  if (code) await user.type(screen.getByLabelText('Code'), code);
  await user.click(screen.getByRole('button', { name: 'Confirm' }));
}

describe('VerifyRegistrationPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('says where the code went', () => {
    renderVerify();

    expect(screen.getByText('dev@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Code')).toHaveAttribute('autocomplete', 'one-time-code');
    expect(screen.getByRole('link', { name: 'Use another email address' })).toHaveAttribute('href', '/register');
  });

  it('goes back to register when it was opened without an email address', () => {
    renderVerify(null);

    expect(screen.getByText('Register page')).toBeInTheDocument();
  });

  it('wants six digits before calling the server', async () => {
    renderVerify();

    await submit('12a4');

    expect(screen.getByText('Enter the 6-digit code from the email')).toBeInTheDocument();
    expect(verifyRegistration).not.toHaveBeenCalled();
  });

  it('creates the account with the code and goes to the login page', async () => {
    verifyRegistration.mockResolvedValue(buildDeveloper());
    const router = renderVerify();

    await submit('482913');

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(verifyRegistration).toHaveBeenCalledWith({ email: 'dev@example.com', code: '482913' });
    expect(router.state.location.state).toEqual({
      notice: 'Account created. Log in to continue.',
      email: 'dev@example.com',
    });
  });

  it('shows a wrong code on the field and stays on the page', async () => {
    verifyRegistration.mockRejectedValue(
      new ApiError({ status: 400, code: 'invalid_verification_code', message: 'The code is wrong or has expired.' }),
    );
    renderVerify();

    await submit('000000');

    expect(await screen.findByText('The code is wrong or has expired.')).toBeInTheDocument();
    expect(screen.getByLabelText('Code')).toBeInvalid();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
  });

  it('shows a cancelled registration as a form error', async () => {
    verifyRegistration.mockRejectedValue(
      new ApiError({
        status: 400,
        code: 'verification_attempts_exceeded',
        message: 'Too many wrong codes. Register again to get a new one.',
      }),
    );
    renderVerify();

    await submit('000000');

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many wrong codes');
  });

  describe('Send a new code', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // The countdown re-arms its timer after every tick, so the clock moves one second at a time.
    async function waitOutTheMinute() {
      for (let second = 0; second < 60; second += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1000);
        });
      }
    }

    it('waits a minute, because a code was just sent', async () => {
      renderVerify();

      expect(screen.getByRole('button', { name: /^Send a new code \(\d+s\)$/ })).toBeDisabled();

      await waitOutTheMinute();

      expect(screen.getByRole('button', { name: 'Send a new code' })).toBeEnabled();
    });

    it('asks the server for a new code, says so, and waits again', async () => {
      resendRegistrationCode.mockResolvedValue(undefined);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderVerify();
      await waitOutTheMinute();

      await user.click(screen.getByRole('button', { name: 'Send a new code' }));

      expect(resendRegistrationCode).toHaveBeenCalledWith({ email: 'dev@example.com' });
      expect(await screen.findByRole('status')).toHaveTextContent('A new code is on its way');
      expect(screen.getByRole('button', { name: /^Send a new code \(\d+s\)$/ })).toBeDisabled();
    });

    it('shows a refused request as a form error', async () => {
      resendRegistrationCode.mockRejectedValue(
        new ApiError({ status: 429, code: 'rate_limited', message: 'A code was just sent. Wait a minute.' }),
      );
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderVerify();
      await waitOutTheMinute();

      await user.click(screen.getByRole('button', { name: 'Send a new code' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('A code was just sent');
    });
  });
});
