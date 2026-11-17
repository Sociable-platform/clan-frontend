import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listApiKeys } from '@/features/apiKeys/api/apiKeysApi';
import { listGames } from '@/features/games/api/gamesApi';
import { listInvitations } from '@/features/invitations/api/invitationsApi';
import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/store';
import { buildDeveloper, buildGame, buildInvitation } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { GamesPage } from './GamesPage';

vi.mock('@/features/apiKeys/api/apiKeysApi');
vi.mock('@/features/games/api/gamesApi');
vi.mock('@/features/invitations/api/invitationsApi');

const OWNED = buildGame({ id: 'g1', name: 'Space Raiders', role: 'owner' });
const SHARED = buildGame({ id: 'g2', name: 'Farm Clicker', role: 'member' });

function renderGames(entry = '/games') {
  useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer: buildDeveloper() });
  return renderWithRouter(
    [
      { path: '/games', element: <GamesPage /> },
      { path: '/invitations', element: <p>Invitations page</p> },
    ],
    { initialEntries: [entry] },
  );
}

const rowOf = async (name) => (await screen.findByRole('rowheader', { name: new RegExp(`^${name}`) })).closest('tr');

describe('GamesPage, roles and teams', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listInvitations.mockResolvedValue([]);
    listApiKeys.mockResolvedValue([]);
    listGames.mockResolvedValue([OWNED, SHARED]);
  });

  it('shows the developer\'s role on each game', async () => {
    renderGames();

    expect(within(await rowOf('Space Raiders')).getByLabelText('Your role in Space Raiders: Owner')).toBeInTheDocument();
    expect(within(await rowOf('Farm Clicker')).getByLabelText('Your role in Farm Clicker: Member')).toBeInTheDocument();
  });

  it('gives every game a Team link and every game the widget editor', async () => {
    renderGames();

    for (const [name, id] of [['Space Raiders', 'g1'], ['Farm Clicker', 'g2']]) {
      const row = await rowOf(name);
      expect(within(row).getByRole('link', { name: `Team of ${name}` })).toHaveAttribute('href', `/games/${id}/team`);
      expect(within(row).getByRole('link', { name: 'Customize widget' })).toHaveAttribute('href', `/games/${id}/widget`);
    }
  });

  it('hides the API keys of a game the developer is only a member of, and keeps them for an owner', async () => {
    renderGames();

    expect(within(await rowOf('Space Raiders')).getByRole('button', { name: 'API keys' })).toBeInTheDocument();
    expect(within(await rowOf('Farm Clicker')).queryByRole('button', { name: 'API keys' })).not.toBeInTheDocument();
  });

  it('does not open the API keys of a member\'s game even when the address asks for it', async () => {
    renderGames('/games?keys=g2');

    await rowOf('Farm Clicker');
    expect(screen.queryByRole('region', { name: /API keys of/ })).not.toBeInTheDocument();
    expect(listApiKeys).not.toHaveBeenCalled();
  });

  it('still opens an owner\'s API keys from the address', async () => {
    renderGames('/games?keys=g1');

    expect(await screen.findByRole('region', { name: 'API keys of Space Raiders' })).toBeInTheDocument();
    expect(listApiKeys).toHaveBeenCalledTimes(1);
  });

  describe('invitations', () => {
    it('says nothing when there are none', async () => {
      renderGames();

      await rowOf('Space Raiders');
      expect(screen.queryByText(/pending invitation/)).not.toBeInTheDocument();
    });

    it('says how many invitations wait, with a link to them', async () => {
      const user = userEvent.setup();
      listInvitations.mockResolvedValue([buildInvitation({ id: 'i1' })]);
      renderGames();

      const notice = await screen.findByText(/You have 1 pending invitation to a game/);
      await user.click(within(notice).getByRole('link', { name: 'Review invitations' }));

      expect(await screen.findByText('Invitations page')).toBeInTheDocument();
    });

    it('counts several', async () => {
      listInvitations.mockResolvedValue([buildInvitation({ id: 'i1' }), buildInvitation({ id: 'i2' })]);

      renderGames();

      expect(await screen.findByText(/You have 2 pending invitations to games/)).toBeInTheDocument();
    });

    it('does not get in the way when the invitations cannot be loaded', async () => {
      listInvitations.mockRejectedValue(new ApiError({ status: 500, code: 'internal_error', message: 'x' }));

      renderGames();

      expect(await rowOf('Space Raiders')).toBeInTheDocument();
      expect(screen.queryByText(/pending invitation/)).not.toBeInTheDocument();
      expect(screen.queryByText('Could not load your games')).not.toBeInTheDocument();
    });
  });
});
