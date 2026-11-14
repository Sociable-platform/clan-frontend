import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api';
import { ROLES, useAuthStore } from '@/store';
import { buildAdmin, buildDeveloper, buildSuspendedDeveloper } from '@/test/builders';

import { getCurrentDeveloper } from '../../api/authApi';

import { SuspensionBanner } from './SuspensionBanner';

vi.mock('../../api/authApi');

function signInDeveloper(developer) {
  useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer });
}

describe('SuspensionBanner', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows nothing to an active developer', () => {
    signInDeveloper(buildDeveloper());

    render(<SuspensionBanner />);

    expect(screen.queryByRole('status', { name: 'Account suspended' })).not.toBeInTheDocument();
  });

  it('shows nothing to an admin', () => {
    useAuthStore
      .getState()
      .startSession({ token: 't', expiresAt: Date.now() + 60_000, role: ROLES.ADMIN, admin: buildAdmin() });

    render(<SuspensionBanner />);

    expect(screen.queryByRole('status', { name: 'Account suspended' })).not.toBeInTheDocument();
  });

  it.each([
    ['non_payment', /unpaid balance/i],
    ['abuse', /violation of the terms/i],
    ['other', /^Your account is suspended\./],
  ])('explains a suspension for %s', (reason, expected) => {
    signInDeveloper(buildSuspendedDeveloper(reason));

    render(<SuspensionBanner />);

    const banner = screen.getByRole('status', { name: 'Account suspended' });
    expect(banner).toHaveTextContent(expected);
    expect(banner).toHaveTextContent(/changes are turned off/i);
  });

  it('uses the generic text for a reason it does not know, or none yet', () => {
    signInDeveloper(buildSuspendedDeveloper('something_new'));
    const { unmount } = render(<SuspensionBanner />);
    expect(screen.getByRole('status', { name: 'Account suspended' })).toHaveTextContent(
      /^Your account is suspended\./,
    );
    unmount();

    useAuthStore.getState().setDeveloper(buildSuspendedDeveloper(null));
    render(<SuspensionBanner />);
    expect(screen.getByRole('status', { name: 'Account suspended' })).toHaveTextContent(
      /^Your account is suspended\./,
    );
  });

  it('never shows an internal note, even if one were somehow on the profile', () => {
    signInDeveloper(buildSuspendedDeveloper('abuse', { note: 'Invoice 1042 unpaid' }));

    render(<SuspensionBanner />);

    expect(screen.queryByText(/Invoice 1042/)).not.toBeInTheDocument();
  });

  it('tells the developer who to contact', () => {
    signInDeveloper(buildSuspendedDeveloper());

    render(<SuspensionBanner />);

    expect(screen.getByRole('status', { name: 'Account suspended' })).toHaveTextContent(/contact/i);
  });

  it('appears when a suspension is detected while the page is open', () => {
    signInDeveloper(buildDeveloper());
    render(<SuspensionBanner />);
    expect(screen.queryByRole('status', { name: 'Account suspended' })).not.toBeInTheDocument();

    act(() => {
      useAuthStore.getState().markDeveloperSuspended();
    });

    expect(screen.getByRole('status', { name: 'Account suspended' })).toBeInTheDocument();
  });

  it('goes away after "Check again" finds the account resumed', async () => {
    const user = userEvent.setup();
    signInDeveloper(buildSuspendedDeveloper());
    getCurrentDeveloper.mockResolvedValue(buildDeveloper());
    render(<SuspensionBanner />);

    await user.click(screen.getByRole('button', { name: 'Check again' }));

    await waitFor(() =>
      expect(screen.queryByRole('status', { name: 'Account suspended' })).not.toBeInTheDocument(),
    );
  });

  it('stays, and says so, when "Check again" fails', async () => {
    const user = userEvent.setup();
    signInDeveloper(buildSuspendedDeveloper());
    getCurrentDeveloper.mockRejectedValue(new ApiError({ status: 0, code: 'network_error', message: 'Down' }));
    render(<SuspensionBanner />);

    await user.click(screen.getByRole('button', { name: 'Check again' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not check your account');
    expect(screen.getByRole('status', { name: 'Account suspended' })).toBeInTheDocument();
  });
});
