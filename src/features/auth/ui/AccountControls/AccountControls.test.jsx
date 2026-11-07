import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AUTH_STATUS, readStoredSession, useAuthStore } from '@/store';
import { buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { AccountControls } from './AccountControls';

describe('AccountControls', () => {
  it('log out clears the store and the stored token', async () => {
    useAuthStore.getState().startSession({
      token: 'abc',
      expiresAt: Date.now() + 60_000,
      developer: buildDeveloper(),
    });
    renderWithRouter([{ path: '/', element: <AccountControls /> }]);
    expect(readStoredSession()).not.toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(useAuthStore.getState()).toMatchObject({
      status: AUTH_STATUS.UNAUTHENTICATED,
      token: null,
      developer: null,
    });
    expect(readStoredSession()).toBeNull();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });
});
