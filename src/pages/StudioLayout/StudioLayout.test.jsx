import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { logoutDeveloper } from '@/features/auth/api/authApi';
import { listGames } from '@/features/games/api/gamesApi';
import { listInvitations } from '@/features/invitations/api/invitationsApi';
import { AUTH_STATUS, useAuthStore } from '@/store';
import { buildDeveloper, buildGame, buildInvitation } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { StudioLayout } from './StudioLayout';

vi.mock('@/features/auth/api/authApi');
vi.mock('@/features/games/api/gamesApi');
vi.mock('@/features/invitations/api/invitationsApi');

const OWNED = buildGame({ id: 'g1', name: 'Space Raiders', role: 'owner' });
const SHARED = buildGame({ id: 'g2', name: 'Farm Clicker', role: 'member' });

function renderStudio(entry = '/games') {
  useAuthStore
    .getState()
    .startSession({ token: 't', expiresAt: Date.now() + 60_000, developer: buildDeveloper({ name: 'Omar', email: 'omar@example.com' }) });
  return renderWithRouter(
    [
      {
        element: <StudioLayout banner={<p>Banner</p>} />,
        children: [
          { path: '/games', element: <h1>Games page</h1> },
          { path: '/invitations', element: <h1>Invitations page</h1> },
          { path: '/games/:gameId/team', element: <h1>Team page</h1> },
          { path: '/games/:gameId/keys', element: <h1>Keys page</h1> },
        ],
      },
      { path: '/games/:gameId/widget', element: <h1>Editor</h1> },
      { path: '/docs', element: <h1>Docs</h1> },
      { path: '/support', element: <h1>Support</h1> },
    ],
    { initialEntries: [entry] },
  );
}

describe('StudioLayout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listGames.mockResolvedValue([OWNED, SHARED]);
    listInvitations.mockResolvedValue([]);
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('shows the page beside the sidebar, with the banner above the page', async () => {
    renderStudio();

    expect(await screen.findByRole('heading', { name: 'Games page' })).toBeInTheDocument();
    expect(screen.getByText('Banner')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Studio' })).toBeInTheDocument();
  });

  describe('with all games', () => {
    it('offers Games and Invitations and marks the open one', async () => {
      renderStudio('/invitations');

      const nav = await screen.findByRole('navigation', { name: 'Pages' });
      expect(within(nav).getByRole('link', { name: 'Games' })).toHaveAttribute('href', '/games');
      expect(within(nav).getByRole('link', { name: 'Games' })).not.toHaveAttribute('aria-current');
      expect(within(nav).getByRole('link', { name: /^Invitations/ })).toHaveAttribute('aria-current', 'page');
    });

    it('says how many games there are on the switcher', async () => {
      renderStudio();

      const switcher = await screen.findByRole('button', { name: 'Switch game' });
      expect(await within(switcher).findByText('2 games')).toBeInTheDocument();
      expect(within(switcher).getByText('All games')).toBeInTheDocument();
    });

    it('shows how many invitations wait', async () => {
      listInvitations.mockResolvedValue([buildInvitation({ id: 'i1' }), buildInvitation({ id: 'i2' })]);
      renderStudio();

      expect(await screen.findByLabelText('2 waiting')).toHaveTextContent('2');
    });

    it('has no game pages', async () => {
      renderStudio();

      await screen.findByRole('navigation', { name: 'Pages' });
      expect(screen.queryByRole('link', { name: 'Team' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'API keys' })).not.toBeInTheDocument();
    });
  });

  describe('inside a game', () => {
    it('names the game and the role on the switcher', async () => {
      renderStudio('/games/g1/team');

      const switcher = await screen.findByRole('button', { name: 'Switch game' });
      expect(await within(switcher).findByText('Space Raiders')).toBeInTheDocument();
      expect(within(switcher).getByText('Owner')).toBeInTheDocument();
    });

    it('gives an owner the widget editor, the team and the API keys of that game', async () => {
      renderStudio('/games/g1/team');

      const nav = await screen.findByRole('navigation', { name: 'Pages of Space Raiders' });
      expect(within(nav).getByRole('link', { name: 'Customize widget' })).toHaveAttribute('href', '/games/g1/widget');
      expect(within(nav).getByRole('link', { name: 'Team' })).toHaveAttribute('aria-current', 'page');
      expect(within(nav).getByRole('link', { name: 'API keys' })).toHaveAttribute('href', '/games/g1/keys');
      expect(within(nav).getByRole('link', { name: 'All games' })).toHaveAttribute('href', '/games');
    });

    it('gives a member no API keys', async () => {
      renderStudio('/games/g2/team');

      const nav = await screen.findByRole('navigation', { name: 'Pages of Farm Clicker' });
      expect(within(nav).getByRole('link', { name: 'Team' })).toBeInTheDocument();
      expect(within(nav).queryByRole('link', { name: 'API keys' })).not.toBeInTheDocument();
    });

    it('keeps the game pages, without API keys, for a game that is not in the list', async () => {
      renderStudio('/games/unknown/team');

      const nav = await screen.findByRole('navigation', { name: 'Pages of this game' });
      expect(within(nav).getByRole('link', { name: 'Team' })).toHaveAttribute('href', '/games/unknown/team');
      expect(within(nav).queryByRole('link', { name: 'API keys' })).not.toBeInTheDocument();
    });
  });

  it('switches to another game from the switcher', async () => {
    const user = userEvent.setup();
    renderStudio();
    await within(await screen.findByRole('button', { name: 'Switch game' })).findByText('2 games');

    await user.click(screen.getByRole('button', { name: 'Switch game' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /Space Raiders.*Owner/ })).toBeInTheDocument();
    await user.click(within(menu).getByRole('menuitem', { name: /Farm Clicker.*Member/ }));

    expect(await screen.findByRole('heading', { name: 'Team page' })).toBeInTheDocument();
    expect(await screen.findByRole('navigation', { name: 'Pages of Farm Clicker' })).toBeInTheDocument();
  });

  it('links to the guide and to support', async () => {
    renderStudio();

    const help = await screen.findByRole('navigation', { name: 'Help' });
    expect(within(help).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
    expect(within(help).getByRole('link', { name: 'Support' })).toHaveAttribute('href', '/support');
  });

  it('shows who is signed in and logs out', async () => {
    const user = userEvent.setup();
    logoutDeveloper.mockResolvedValue(undefined);
    renderStudio();

    expect(await screen.findByText('Omar')).toBeInTheDocument();
    expect(screen.getByText('omar@example.com')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(logoutDeveloper).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED);
  });

  it('opens and closes the menu on a narrow screen, and closes it when the page changes', async () => {
    const user = userEvent.setup();
    renderStudio();
    const button = await screen.findByRole('button', { name: 'Menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('link', { name: /^Invitations/ }));
    expect(await screen.findByRole('heading', { name: 'Invitations page' })).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
