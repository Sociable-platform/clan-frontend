import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AUTH_STATUS, useAuthStore } from '@/store';
import { buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { GuestOnly } from './GuestOnly';
import { RequireAuth } from './RequireAuth';

const routes = [
  { path: '/login', element: <GuestOnly />, children: [{ index: true, element: <p>Login page</p> }] },
  {
    path: '/projects',
    element: <RequireAuth />,
    children: [{ index: true, element: <p>Projects page</p> }],
  },
];

function signIn() {
  useAuthStore.setState({ status: AUTH_STATUS.AUTHENTICATED, token: 't', developer: buildDeveloper() });
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
