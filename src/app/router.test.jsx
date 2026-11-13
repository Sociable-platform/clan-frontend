import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@/shared/api';
import { AUTH_STATUS, ROLES } from '@/store';
import {
  buildAdmin,
  buildAdminDeveloperDetail,
  buildAdminDeveloperPage,
  buildAuditPage,
  buildDeveloper,
} from '@/test/builders';

const ADMIN_SESSION = { token: 't', role: ROLES.ADMIN, admin: buildAdmin() };
const DEVELOPER_SESSION = { token: 't', role: ROLES.DEVELOPER, developer: buildDeveloper() };

// The developers page asks the server for its list; this suite is about which page shows.
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
