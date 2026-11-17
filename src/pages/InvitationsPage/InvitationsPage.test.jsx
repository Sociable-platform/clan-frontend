import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listGames } from '@/features/games/api/gamesApi';
import { useGamesQuery } from '@/features/games';
import { acceptInvitation, declineInvitation, listInvitations } from '@/features/invitations/api/invitationsApi';
import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/store';
import { buildDeveloper, buildGame, buildInvitation, buildSuspendedDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { InvitationsPage } from './InvitationsPage';

vi.mock('@/features/games/api/gamesApi');
vi.mock('@/features/invitations/api/invitationsApi');

const RAIDERS = buildInvitation({ id: 'i1', gameId: 'g1', gameName: 'Space Raiders', invitedByName: 'Ali' });
const FARM = buildInvitation({ id: 'i2', gameId: 'g2', gameName: 'Farm Clicker', invitedByName: 'Emma' });

const apiError = (status, code) => new ApiError({ status, code, message: 'server text' });

function signIn(developer = buildDeveloper()) {
  useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer });
}

/** Stands in for the games page: it watches the games list, as the real one does while it is open. */
function GamesProbe() {
  const { games } = useGamesQuery();
  return <p data-testid="games">{games.map((game) => `${game.name} (${game.role})`).join(', ')}</p>;
}

function renderInvitations() {
  return renderWithRouter(
    [
      {
        path: '/invitations',
        element: (
          <>
            <InvitationsPage />
            <GamesProbe />
          </>
        ),
      },
    ],
    { initialEntries: ['/invitations'] },
  );
}

const accept = (name) => screen.findByRole('button', { name: `Accept the invitation to ${name}` });
const decline = (name) => screen.findByRole('button', { name: `Decline the invitation to ${name}` });

describe('InvitationsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    signIn();
    listGames.mockResolvedValue([]);
  });

  it('lists the invitations with the game, who invited and when it expires', async () => {
    listInvitations.mockResolvedValue([RAIDERS, FARM]);

    renderInvitations();

    const list = await screen.findByRole('list', { name: 'Invitations' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Space Raiders');
    expect(rows[0]).toHaveTextContent('Invited by Ali');
    expect(rows[0]).toHaveTextContent('Expires Nov 24, 2026');
    expect(rows[1]).toHaveTextContent('Farm Clicker');
  });

  it('says so when there are no invitations', async () => {
    listInvitations.mockResolvedValue([]);

    renderInvitations();

    expect(await screen.findByText('No invitations')).toBeInTheDocument();
  });

  it('announces loading', async () => {
    listInvitations.mockReturnValue(new Promise(() => {}));

    renderInvitations();

    expect(await screen.findByText('Loading invitations')).toBeInTheDocument();
  });

  it('offers a retry when the list cannot be loaded', async () => {
    const user = userEvent.setup();
    listInvitations.mockRejectedValueOnce(apiError(500, 'internal_error'));
    renderInvitations();

    expect(await screen.findByText('Could not load your invitations')).toBeInTheDocument();
    listInvitations.mockResolvedValue([RAIDERS]);
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('list', { name: 'Invitations' })).toHaveTextContent('Space Raiders');
  });

  describe('accepting', () => {
    it('joins the game, says so with links to it, drops the invitation and refreshes the games list', async () => {
      const user = userEvent.setup();
      listInvitations.mockResolvedValue([RAIDERS, FARM]);
      acceptInvitation.mockResolvedValue(undefined);
      renderInvitations();

      const button = await accept('Space Raiders');
      listInvitations.mockResolvedValue([FARM]);
      listGames.mockResolvedValue([buildGame({ id: 'g1', name: 'Space Raiders', role: 'member' })]);
      await user.click(button);

      await waitFor(() => expect(acceptInvitation).toHaveBeenCalledWith({ inviteId: 'i1' }));
      const notice = await screen.findByText(/You joined Space Raiders/);
      expect(within(notice).getByRole('link', { name: 'Customize its widget' })).toHaveAttribute('href', '/games/g1/widget');
      expect(within(notice).getByRole('link', { name: 'see the team' })).toHaveAttribute('href', '/games/g1/team');
      await waitFor(() => expect(screen.queryByText(/Invited by Ali/)).not.toBeInTheDocument());
      expect(screen.getByText('Farm Clicker')).toBeInTheDocument();
      // The new game has to show up in the games list: it is fetched again, not guessed at.
      await waitFor(() => expect(screen.getByTestId('games')).toHaveTextContent('Space Raiders (member)'));
    });

    it('turns every button off while one answer is on its way', async () => {
      const user = userEvent.setup();
      listInvitations.mockResolvedValue([RAIDERS, FARM]);
      acceptInvitation.mockReturnValue(new Promise(() => {}));
      renderInvitations();

      await user.click(await accept('Space Raiders'));

      expect(await screen.findByRole('button', { name: 'Accept the invitation to Space Raiders' })).toHaveTextContent('Working…');
      expect(screen.getByRole('button', { name: 'Accept the invitation to Farm Clicker' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Decline the invitation to Farm Clicker' })).toBeDisabled();
    });

    it('says the invitation is gone when the owner took it back (404 invite_not_found)', async () => {
      const user = userEvent.setup();
      listInvitations.mockResolvedValue([RAIDERS]);
      acceptInvitation.mockRejectedValue(apiError(404, 'invite_not_found'));
      renderInvitations();

      listInvitations.mockResolvedValue([]);
      await user.click(await accept('Space Raiders'));

      expect(await screen.findByRole('alert')).toHaveTextContent('This invitation is no longer available. The owner may have taken it back.');
      expect(screen.queryByText(/You joined/)).not.toBeInTheDocument();
      expect(await screen.findByText('No invitations')).toBeInTheDocument();
    });

    it('says the invitation expired and what to do (410 invite_expired)', async () => {
      const user = userEvent.setup();
      listInvitations.mockResolvedValue([RAIDERS]);
      acceptInvitation.mockRejectedValue(apiError(410, 'invite_expired'));
      renderInvitations();

      await user.click(await accept('Space Raiders'));

      expect(await screen.findByRole('alert')).toHaveTextContent('This invitation has expired. Ask the game’s owner to send a new one.');
    });

    it('is generic for any other failure and keeps the invitation to try again', async () => {
      const user = userEvent.setup();
      listInvitations.mockResolvedValue([RAIDERS]);
      acceptInvitation.mockRejectedValue(apiError(500, 'internal_error'));
      renderInvitations();

      await user.click(await accept('Space Raiders'));

      expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Try again.');
      expect(await accept('Space Raiders')).toBeEnabled();
    });
  });

  describe('declining', () => {
    it('declines, drops the invitation and joins nothing', async () => {
      const user = userEvent.setup();
      listInvitations.mockResolvedValue([RAIDERS, FARM]);
      declineInvitation.mockResolvedValue(undefined);
      renderInvitations();

      const button = await decline('Space Raiders');
      listInvitations.mockResolvedValue([FARM]);
      await user.click(button);

      await waitFor(() => expect(declineInvitation).toHaveBeenCalledWith({ inviteId: 'i1' }));
      await waitFor(() => expect(screen.queryByText(/Invited by Ali/)).not.toBeInTheDocument());
      expect(acceptInvitation).not.toHaveBeenCalled();
      expect(screen.queryByText(/You joined/)).not.toBeInTheDocument();
    });

    it('says when the invitation is gone already', async () => {
      const user = userEvent.setup();
      listInvitations.mockResolvedValue([RAIDERS]);
      declineInvitation.mockRejectedValue(apiError(404, 'invite_not_found'));
      renderInvitations();

      await user.click(await decline('Space Raiders'));

      expect(await screen.findByRole('alert')).toHaveTextContent('This invitation is no longer available.');
    });
  });

  it('is read-only for a suspended account: the invitations can be read but not answered', async () => {
    signIn(buildSuspendedDeveloper());
    listInvitations.mockResolvedValue([RAIDERS]);

    renderInvitations();

    expect(await accept('Space Raiders')).toBeDisabled();
    expect(await decline('Space Raiders')).toBeDisabled();
    expect(screen.getByText(/account is suspended/i)).toBeInTheDocument();
  });
});
