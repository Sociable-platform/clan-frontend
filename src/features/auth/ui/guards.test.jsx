import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AUTH_STATUS, ROLES, useAuthStore } from '@/store';
import { buildAdmin, buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { GuestOnly } from './GuestOnly';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';

const routes = [
  { path: '/login', element: <GuestOnly />, children: [{ index: true, element: <p>Login page</p> }] },
  {
    path: '/projects',
    element: <RequireAuth />,
    children: [{ index: true, element: <p>Projects page</p> }],
  },
  {
    path: '/admin/login',
    element: <GuestOnly role={ROLES.ADMIN} />,
    children: [{ index: true, element: <p>Admin login page</p> }],
  },
  {
    path: '/admin/developers',
    element: <RequireRole role={ROLES.ADMIN} stealth notFound={<p>Page not found</p>} />,
    children: [{ index: true, element: <p>Admin developers page</p> }],
  },
  {
    // The non-stealth form: anyone else is sent to the role's login page.
    path: '/staff',
    element: <RequireRole role={ROLES.ADMIN} />,
    children: [{ index: true, element: <p>Staff page</p> }],
  },
  { path: '/admin-home', element: <p>Admin home</p> },
];

function signIn() {
  useAuthStore.setState({
    status: AUTH_STATUS.AUTHENTICATED,
    token: 't',
    role: ROLES.DEVELOPER,
    developer: buildDeveloper(),
  });
}

function signInAsAdmin() {
  useAuthStore.setState({
    status: AUTH_STATUS.AUTHENTICATED,
    token: 't',
    role: ROLES.ADMIN,
    admin: buildAdmin(),
  });
}

function signOutLocally() {
  useAuthStore.setState({ status: AUTH_STATUS.UNAUTHENTICATED });
}

describe('RequireAuth', () => {
  it('waits for the session restore instead of redirecting', () => {
    renderWithRouter(routes, { initialEntries: ['/projects'] });

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('redirects a guest to the login page and remembers where they were going', () => {
    signOutLocally();
    const router = renderWithRouter(routes, { initialEntries: ['/projects?tab=keys'] });

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(router.state.location.state).toEqual({ from: '/projects?tab=keys' });
  });

  it('renders the page for a logged-in developer', () => {
    signIn();
    renderWithRouter(routes, { initialEntries: ['/projects'] });

    expect(screen.getByText('Projects page')).toBeInTheDocument();
  });
});

describe('GuestOnly', () => {
  it('shows the login page to a guest', () => {
    signOutLocally();
    renderWithRouter(routes, { initialEntries: ['/login'] });

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('sends a logged-in developer to the page they came from', () => {
    signIn();
    renderWithRouter(routes, { initialEntries: [{ pathname: '/login', state: { from: '/projects' } }] });

    expect(screen.getByText('Projects page')).toBeInTheDocument();
  });
});

describe('RequireAuth for an admin session', () => {
  it('sends an admin away from the developer pages to the admin home', () => {
    signInAsAdmin();
    const router = renderWithRouter(routes, { initialEntries: ['/projects'] });

    expect(screen.queryByText('Projects page')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/developers');
    expect(screen.getByText('Admin developers page')).toBeInTheDocument();
  });
});

describe('GuestOnly for a session of the other role', () => {
  it('shows the developer login page to a signed-in admin so they can switch', () => {
    signInAsAdmin();
    renderWithRouter(routes, { initialEntries: ['/login'] });

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows the admin login page to a signed-in developer so they can switch', () => {
    signIn();
    renderWithRouter(routes, { initialEntries: ['/admin/login'] });

    expect(screen.getByText('Admin login page')).toBeInTheDocument();
  });

  it('sends a signed-in admin from the admin login page to the admin home', () => {
    signInAsAdmin();
    const router = renderWithRouter(routes, { initialEntries: ['/admin/login'] });

    expect(router.state.location.pathname).toBe('/admin/developers');
  });

  it('ignores an unsafe return address on the admin login page', () => {
    signInAsAdmin();
    const router = renderWithRouter(routes, {
      initialEntries: [{ pathname: '/admin/login', state: { from: '//evil.example' } }],
    });

    expect(router.state.location.pathname).toBe('/admin/developers');
  });
});

describe('RequireRole', () => {
  it('waits for the session restore instead of showing the 404 page', () => {
    renderWithRouter(routes, { initialEntries: ['/admin/developers'] });

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByText('Page not found')).not.toBeInTheDocument();
  });

  it('shows the page to an admin', () => {
    signInAsAdmin();
    renderWithRouter(routes, { initialEntries: ['/admin/developers'] });

    expect(screen.getByText('Admin developers page')).toBeInTheDocument();
  });

  it('stealth: shows the 404 page to a guest and keeps the URL', () => {
    signOutLocally();
    const router = renderWithRouter(routes, { initialEntries: ['/admin/developers'] });

    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.queryByText('Admin developers page')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/developers');
  });

  it('stealth: shows the 404 page to a signed-in developer', () => {
    signIn();
    renderWithRouter(routes, { initialEntries: ['/admin/developers'] });

    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.queryByText('Admin developers page')).not.toBeInTheDocument();
  });

  it('without stealth: sends a guest to the role login page and remembers where they were going', () => {
    signOutLocally();
    const router = renderWithRouter(routes, { initialEntries: ['/staff?tab=audit'] });

    expect(screen.getByText('Admin login page')).toBeInTheDocument();
    expect(router.state.location.state).toEqual({ from: '/staff?tab=audit' });
  });
});
