import { QueryClientProvider } from '@tanstack/react-query';
import { configure, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@/shared/api';
import { AUTH_STATUS, ROLES } from '@/store';
import {
  buildAdmin,
  buildAdminDeveloperDetail,
  buildAdminDeveloperPage,
  buildAuditPage,
  buildDeveloper,
  buildSuspendedDeveloper,
} from '@/test/builders';

// Every test here imports the whole route tree afresh and then waits for a page that is loaded on
// demand. In a full run, with every test file competing for the machine, that can take longer than the
// default one second (and the first import close to the default five-second test limit), so both
// limits are raised for this file only.
beforeAll(() => {
  configure({ asyncUtilTimeout: 5000 });
  vi.setConfig({ testTimeout: 20000 });
});
afterAll(() => {
  configure({ asyncUtilTimeout: 1000 });
  vi.resetConfig();
});

const ADMIN_SESSION = { token: 't', role: ROLES.ADMIN, admin: buildAdmin() };
const DEVELOPER_SESSION = { token: 't', role: ROLES.DEVELOPER, developer: buildDeveloper() };

// The developers page asks the server for its list; this suite is about which page shows.
vi.mock('@/features/games/api/gamesApi', () => ({
  listGames: vi.fn(async () => []),
  registerGame: vi.fn(),
}));

// The team and invitation pages ask for their lists too; these tests are about which page shows.
vi.mock('@/features/invitations/api/invitationsApi', () => ({
  listInvitations: vi.fn(async () => []),
  acceptInvitation: vi.fn(),
  declineInvitation: vi.fn(),
}));

vi.mock('@/features/team/api/teamApi', () => ({
  listMembers: vi.fn(async () => []),
  listGameInvites: vi.fn(async () => []),
  inviteToGame: vi.fn(),
  cancelInvite: vi.fn(),
  removeMember: vi.fn(),
  transferOwnership: vi.fn(),
  leaveGame: vi.fn(),
}));

vi.mock('@/features/admin/api/adminApi', () => ({
  listAdminDevelopers: vi.fn(async () => buildAdminDeveloperPage([])),
  getAdminDeveloper: vi.fn(async () => buildAdminDeveloperDetail()),
  listAdminAuditLog: vi.fn(async () => buildAuditPage([])),
}));

// The real route tree. `createBrowserRouter` reads the URL when the module loads, so each test
// sets the URL first and then imports a fresh copy of the router. That fresh copy has its own
// auth store, so the session is seeded through the same fresh import (not the one in test/setup).
async function renderAt(path, session = null) {
  window.history.pushState({}, '', path);
  vi.resetModules();
  const { useAuthStore } = await import('@/store');
  useAuthStore.setState(
    session
      ? { status: AUTH_STATUS.AUTHENTICATED, ...session }
      : { status: AUTH_STATUS.UNAUTHENTICATED },
  );
  const { router } = await import('./router');
  render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe('admin routes', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the 404 page to a guest on /admin/developers', async () => {
    await renderAt('/admin/developers');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/developers');
  });

  it('shows the 404 page to a guest on /admin, so nothing hints that it exists', async () => {
    await renderAt('/admin');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('shows the 404 page to a signed-in developer', async () => {
    await renderAt('/admin/developers', DEVELOPER_SESSION);

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('shows the admin login form to a guest at /admin/login', async () => {
    await renderAt('/admin/login');

    expect(await screen.findByRole('heading', { name: 'Admin sign in' })).toBeInTheDocument();
  });

  it('shows the developers page to an admin', async () => {
    await renderAt('/admin/developers', ADMIN_SESSION);

    expect(await screen.findByRole('heading', { name: 'Developers' })).toBeInTheDocument();
  });

  it('shows one developer to an admin at /admin/developers/:developerId', async () => {
    await renderAt('/admin/developers/d1', ADMIN_SESSION);

    expect(await screen.findByRole('heading', { level: 1, name: 'Dev One' })).toBeInTheDocument();
  });

  it('shows the 404 page to a developer who opens an admin developer page', async () => {
    await renderAt('/admin/developers/d1', DEVELOPER_SESSION);

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('shows the 404 page to a guest who opens an admin developer page', async () => {
    await renderAt('/admin/developers/d1');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('sends an admin from /admin to the developers page', async () => {
    await renderAt('/admin', ADMIN_SESSION);

    expect(await screen.findByRole('heading', { name: 'Developers' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/developers');
  });

  it('sends a signed-in admin away from /admin/login', async () => {
    await renderAt('/admin/login', ADMIN_SESSION);

    expect(await screen.findByRole('heading', { name: 'Developers' })).toBeInTheDocument();
  });

  it('sends an admin who opens a developer page to the admin home', async () => {
    await renderAt('/games', ADMIN_SESSION);

    expect(await screen.findByRole('heading', { name: 'Developers' })).toBeInTheDocument();
  });
});

describe('suspension banner', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows a suspended developer the banner on a dashboard page', async () => {
    await renderAt('/games', { token: 't', role: ROLES.DEVELOPER, developer: buildSuspendedDeveloper('non_payment') });

    expect(await screen.findByRole('status', { name: 'Account suspended' })).toHaveTextContent(/unpaid balance/i);
  });

  it('shows it on every dashboard page, such as the game and the home page', async () => {
    await renderAt('/', { token: 't', role: ROLES.DEVELOPER, developer: buildSuspendedDeveloper('abuse') });

    expect(await screen.findByRole('status', { name: 'Account suspended' })).toHaveTextContent(/terms of service/i);
  });

  it('shows an active developer no banner', async () => {
    await renderAt('/games', DEVELOPER_SESSION);

    await screen.findByRole('heading', { name: 'Your games' });
    expect(screen.queryByRole('status', { name: 'Account suspended' })).not.toBeInTheDocument();
  });

  it('shows an admin no banner', async () => {
    await renderAt('/admin/developers', ADMIN_SESSION);

    await screen.findByRole('heading', { name: 'Developers' });
    expect(screen.queryByRole('status', { name: 'Account suspended' })).not.toBeInTheDocument();
  });
});

describe('team and invitation routes', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows a signed-in developer their invitations at /invitations', async () => {
    await renderAt('/invitations', DEVELOPER_SESSION);

    expect(await screen.findByRole('heading', { name: 'Invitations' })).toBeInTheDocument();
  });

  it('shows a signed-in developer a game\'s team at /games/:gameId/team', async () => {
    const { listGames } = await import('@/features/games/api/gamesApi');
    listGames.mockResolvedValueOnce([{ id: 'g1', name: 'Space Raiders', description: '', role: 'owner', isOwner: true, createdAt: '2026-11-07T09:30:00Z' }]);

    await renderAt('/games/g1/team', DEVELOPER_SESSION);

    expect(await screen.findByRole('heading', { name: /Team of Space Raiders/ })).toBeInTheDocument();
  });

  it('sends a guest to the login page from both', async () => {
    const router = await renderAt('/invitations');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.state).toEqual({ from: '/invitations' });
  });

  it('sends a guest who opens a team page to the login page, and back after logging in', async () => {
    const router = await renderAt('/games/g1/team');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.state).toEqual({ from: '/games/g1/team' });
  });

  it('keeps them away from an admin: an admin has no games and no invitations', async () => {
    const router = await renderAt('/invitations', ADMIN_SESSION);

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/developers'));
  });
});
