import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listGames } from '@/features/games/api/gamesApi';
import {
  cancelInvite,
  inviteToGame,
  leaveGame,
  listGameInvites,
  listMembers,
  removeMember,
  transferOwnership,
} from '@/features/team/api/teamApi';
import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/store';
import {
  buildDeveloper,
  buildGame,
  buildInvite,
  buildMember,
  buildSuspendedDeveloper,
} from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { TeamPage } from './TeamPage';

vi.mock('@/features/games/api/gamesApi');
vi.mock('@/features/team/api/teamApi');

const GAME = buildGame({ id: 'g1', name: 'Space Raiders' });
const ME = buildMember({ developerId: buildDeveloper().id, name: 'Dev One', email: 'dev@example.com', role: 'owner' });
const EMMA = buildMember({ developerId: 'd-emma', name: 'Emma', email: 'emma@example.com', role: 'member' });
const ALI = buildMember({ developerId: 'd-ali', name: 'Ali', email: 'ali@example.com', role: 'owner' });

const apiError = (status, code, message = 'server text') => new ApiError({ status, code, message });

function signIn(developer = buildDeveloper()) {
  useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer });
}

/** The team page of Space Raiders, with a stand-in for the games page to see where leaving goes. */
function renderTeam() {
  return renderWithRouter(
    [
      { path: '/games/:gameId/team', element: <TeamPage /> },
      { path: '/games', element: <p>Your games page</p> },
    ],
    { initialEntries: ['/games/g1/team'] },
  );
}

/** The signed-in developer is an owner of Space Raiders with Emma as a member, unless a test says otherwise. */
function ownerSetup({ members = [ME, EMMA], invites = [], game = GAME } = {}) {
  signIn();
  listGames.mockResolvedValue([game]);
  listMembers.mockResolvedValue(members);
  listGameInvites.mockResolvedValue(invites);
}

const dialog = (name) => screen.findByRole('alertdialog', { name });

describe('TeamPage, as an owner', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows the team with everybody\'s role, marks the signed-in developer and the page header', async () => {
    ownerSetup({ members: [ME, ALI, EMMA] });

    renderTeam();

    expect(await screen.findByRole('heading', { name: /Team of Space Raiders/ })).toHaveTextContent('Owner');
    const team = await screen.findByRole('list', { name: 'Team members' });
    const rows = within(team).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Dev One (you)');
    expect(within(rows[0]).getByLabelText('Dev One is Owner')).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent('Ali');
    expect(rows[2]).toHaveTextContent('Emma');
    expect(within(rows[2]).getByLabelText('Emma is Member')).toBeInTheDocument();
    expect(rows[2]).toHaveTextContent('emma@example.com');
  });

  it('lets an owner act on the others, never on themselves: Remove for anybody, Make owner for members only', async () => {
    ownerSetup({ members: [ME, ALI, EMMA] });

    renderTeam();
    const team = await screen.findByRole('list', { name: 'Team members' });

    expect(within(team).queryByRole('button', { name: 'Remove Dev One' })).not.toBeInTheDocument();
    expect(within(team).getByRole('button', { name: 'Remove Ali' })).toBeEnabled();
    expect(within(team).queryByRole('button', { name: 'Make Ali the owner' })).not.toBeInTheDocument();
    expect(within(team).getByRole('button', { name: 'Remove Emma' })).toBeEnabled();
    expect(within(team).getByRole('button', { name: 'Make Emma the owner' })).toBeEnabled();
  });

  it('lists the pending invitations with who invited and a Cancel, and says so when there are none', async () => {
    ownerSetup({ invites: [buildInvite({ email: 'carol@example.com', invitedByName: 'Ali' })] });

    renderTeam();

    const list = await screen.findByRole('list', { name: 'Pending invitations' });
    expect(list).toHaveTextContent('carol@example.com');
    expect(list).toHaveTextContent('Invited by Ali');
    expect(within(list).getByRole('button', { name: 'Cancel invitation for carol@example.com' })).toBeEnabled();
  });

  it('says there are no pending invitations', async () => {
    ownerSetup();

    renderTeam();

    expect(await screen.findByText('No pending invitations')).toBeInTheDocument();
  });

  describe('removing somebody', () => {
    it('asks first, then removes them and refreshes the team', async () => {
      const user = userEvent.setup();
      ownerSetup();
      removeMember.mockResolvedValue(undefined);
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Remove Emma' }));
      const confirm = await dialog('Remove this developer from the game?');
      expect(within(confirm).getByText(/Emma loses access to this game at once/)).toBeInTheDocument();
      expect(removeMember).not.toHaveBeenCalled();

      listMembers.mockResolvedValue([ME]);
      await user.click(within(confirm).getByRole('button', { name: 'Remove' }));

      await waitFor(() => expect(removeMember).toHaveBeenCalledWith({ gameId: 'g1', developerId: 'd-emma' }));
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      await waitFor(() => expect(screen.queryByText('Emma')).not.toBeInTheDocument());
    });

    it('does nothing when cancelled', async () => {
      const user = userEvent.setup();
      ownerSetup();
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Remove Emma' }));
      await user.click(within(await dialog('Remove this developer from the game?')).getByRole('button', { name: 'Cancel' }));

      expect(removeMember).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('says clearly that only an owner can do this when the server answers 403 owner_required, and keeps the dialog', async () => {
      const user = userEvent.setup();
      ownerSetup();
      removeMember.mockRejectedValue(apiError(403, 'owner_required'));
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Remove Emma' }));
      const confirm = await dialog('Remove this developer from the game?');
      await user.click(within(confirm).getByRole('button', { name: 'Remove' }));

      expect(await within(confirm).findByRole('alert')).toHaveTextContent('Only the game’s owner can do this.');
    });

    it('says when the developer is not on the game any more', async () => {
      const user = userEvent.setup();
      ownerSetup();
      removeMember.mockRejectedValue(apiError(404, 'member_not_found'));
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Remove Emma' }));
      const confirm = await dialog('Remove this developer from the game?');
      await user.click(within(confirm).getByRole('button', { name: 'Remove' }));

      expect(await within(confirm).findByRole('alert')).toHaveTextContent('This developer is no longer on the game.');
    });

    it('offers a retry message for a failure that is none of those', async () => {
      const user = userEvent.setup();
      ownerSetup();
      removeMember.mockRejectedValue(apiError(500, 'internal_error'));
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Remove Emma' }));
      const confirm = await dialog('Remove this developer from the game?');
      await user.click(within(confirm).getByRole('button', { name: 'Remove' }));

      expect(await within(confirm).findByRole('alert')).toHaveTextContent('Could not remove the developer. Try again.');
    });
  });

  describe('handing the game over', () => {
    it('asks first, then makes them the owner; the page turns into the member\'s view once the games list says so', async () => {
      const user = userEvent.setup();
      ownerSetup();
      transferOwnership.mockResolvedValue(undefined);
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Make Emma the owner' }));
      const confirm = await dialog('Make this developer the owner?');
      expect(confirm).toHaveTextContent('Emma becomes the owner of Space Raiders, and you become a member');
      expect(transferOwnership).not.toHaveBeenCalled();

      // After the transfer the server says the signed-in developer is a member and Emma the owner.
      listGames.mockResolvedValue([buildGame({ id: 'g1', name: 'Space Raiders', role: 'member' })]);
      listMembers.mockResolvedValue([{ ...EMMA, role: 'owner', isOwner: true }, { ...ME, role: 'member', isOwner: false }]);
      await user.click(within(confirm).getByRole('button', { name: 'Transfer ownership' }));

      await waitFor(() => expect(transferOwnership).toHaveBeenCalledWith({ gameId: 'g1', developerId: 'd-emma' }));
      expect(await screen.findByText(/Only an owner of the game can invite developers/)).toBeInTheDocument();
      expect(screen.queryByRole('form', { name: 'Invite a developer' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Team of Space Raiders/ })).toHaveTextContent('Member');
    });

    it('explains an owner_required refusal and keeps the dialog', async () => {
      const user = userEvent.setup();
      ownerSetup();
      transferOwnership.mockRejectedValue(apiError(403, 'owner_required'));
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Make Emma the owner' }));
      const confirm = await dialog('Make this developer the owner?');
      await user.click(within(confirm).getByRole('button', { name: 'Transfer ownership' }));

      expect(await within(confirm).findByRole('alert')).toHaveTextContent('Only the game’s owner can do this.');
    });
  });

  describe('inviting a developer', () => {
    it('sends the address, says so, empties the field and refreshes the pending list', async () => {
      const user = userEvent.setup();
      ownerSetup();
      inviteToGame.mockResolvedValue(buildInvite());
      renderTeam();

      const form = await screen.findByRole('form', { name: 'Invite a developer' });
      await user.type(within(form).getByLabelText('Email address'), 'carol@example.com');
      listGameInvites.mockResolvedValue([buildInvite({ email: 'carol@example.com' })]);
      await user.click(within(form).getByRole('button', { name: 'Send invitation' }));

      await waitFor(() => expect(inviteToGame).toHaveBeenCalledWith({ gameId: 'g1', email: 'carol@example.com' }));
      expect(await within(form).findByText('Invitation sent.')).toBeInTheDocument();
      expect(within(form).getByLabelText('Email address')).toHaveValue('');
      expect(await screen.findByRole('list', { name: 'Pending invitations' })).toHaveTextContent('carol@example.com');
    });

    it('checks the address before asking the server', async () => {
      const user = userEvent.setup();
      ownerSetup();
      renderTeam();
      const form = await screen.findByRole('form', { name: 'Invite a developer' });

      await user.click(within(form).getByRole('button', { name: 'Send invitation' }));
      expect(await within(form).findByText('Enter an email address')).toBeInTheDocument();

      await user.type(within(form).getByLabelText('Email address'), 'carol@');
      await user.click(within(form).getByRole('button', { name: 'Send invitation' }));
      expect(await within(form).findByText('Enter a valid email address')).toBeInTheDocument();
      expect(inviteToGame).not.toHaveBeenCalled();
    });

    it('shows the error under the row, so the button stays level with the input', async () => {
      const user = userEvent.setup();
      ownerSetup();
      renderTeam();
      const form = await screen.findByRole('form', { name: 'Invite a developer' });
      const row = form.querySelector('.invite-form-row');

      await user.click(within(form).getByRole('button', { name: 'Send invitation' }));

      const alert = await within(form).findByText('Enter an email address');
      // Not inside the row: an error inside the field's column makes it taller and pushes the button down.
      expect(row).not.toContainElement(alert);
      expect(alert).toHaveAttribute('role', 'alert');
      const input = within(form).getByLabelText('Email address');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', alert.id);
      expect(row).toContainElement(within(form).getByRole('button', { name: 'Send invitation' }));
    });

    it('takes the error away again once something is typed', async () => {
      const user = userEvent.setup();
      ownerSetup();
      renderTeam();
      const form = await screen.findByRole('form', { name: 'Invite a developer' });

      await user.click(within(form).getByRole('button', { name: 'Send invitation' }));
      await within(form).findByText('Enter an email address');
      await user.type(within(form).getByLabelText('Email address'), 'c');

      expect(within(form).queryByText('Enter an email address')).not.toBeInTheDocument();
      expect(within(form).getByLabelText('Email address')).not.toHaveAttribute('aria-invalid');
      expect(within(form).getByLabelText('Email address')).not.toHaveAttribute('aria-describedby');
    });

    it.each([
      ['invalid_email', 400, 'Enter a valid email address'],
      ['already_member', 409, 'This developer is already on the game.'],
    ])('puts %s on the field', async (code, status, message) => {
      const user = userEvent.setup();
      ownerSetup();
      inviteToGame.mockRejectedValue(apiError(status, code));
      renderTeam();
      const form = await screen.findByRole('form', { name: 'Invite a developer' });

      await user.type(within(form).getByLabelText('Email address'), 'emma@example.com');
      await user.click(within(form).getByRole('button', { name: 'Send invitation' }));

      expect(await within(form).findByText(message)).toBeInTheDocument();
      expect(within(form).getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
      expect(within(form).queryByText('Invitation sent.')).not.toBeInTheDocument();
    });

    it('shows the server\'s sentence when a rate limit is hit, and keeps what was typed', async () => {
      const user = userEvent.setup();
      ownerSetup();
      inviteToGame.mockRejectedValue(apiError(429, 'rate_limited', 'This person received many invitations today. Try again tomorrow.'));
      renderTeam();
      const form = await screen.findByRole('form', { name: 'Invite a developer' });

      await user.type(within(form).getByLabelText('Email address'), 'carol@example.com');
      await user.click(within(form).getByRole('button', { name: 'Send invitation' }));

      expect(await within(form).findByRole('alert')).toHaveTextContent('This person received many invitations today. Try again tomorrow.');
      expect(within(form).getByLabelText('Email address')).toHaveValue('carol@example.com');
    });

    it('says clearly that only an owner can invite when the server answers 403 owner_required', async () => {
      const user = userEvent.setup();
      ownerSetup();
      inviteToGame.mockRejectedValue(apiError(403, 'owner_required'));
      renderTeam();
      const form = await screen.findByRole('form', { name: 'Invite a developer' });

      await user.type(within(form).getByLabelText('Email address'), 'carol@example.com');
      await user.click(within(form).getByRole('button', { name: 'Send invitation' }));

      expect(await within(form).findByRole('alert')).toHaveTextContent('Only the game’s owner can do this.');
    });
  });

  describe('taking an invitation back', () => {
    it('cancels it and refreshes the list', async () => {
      const user = userEvent.setup();
      ownerSetup({ invites: [buildInvite({ id: 'i1', email: 'carol@example.com' })] });
      cancelInvite.mockResolvedValue(undefined);
      renderTeam();

      const cancel = await screen.findByRole('button', { name: 'Cancel invitation for carol@example.com' });
      listGameInvites.mockResolvedValue([]);
      await user.click(cancel);

      await waitFor(() => expect(cancelInvite).toHaveBeenCalledWith({ gameId: 'g1', inviteId: 'i1' }));
      expect(await screen.findByText('No pending invitations')).toBeInTheDocument();
    });

    it('says when it could not be cancelled', async () => {
      const user = userEvent.setup();
      ownerSetup({ invites: [buildInvite({ id: 'i1', email: 'carol@example.com' })] });
      cancelInvite.mockRejectedValue(apiError(500, 'internal_error'));
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Cancel invitation for carol@example.com' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Could not cancel the invitation. Try again.');
    });

    it('says the invitation is gone when it was answered in the meantime', async () => {
      const user = userEvent.setup();
      ownerSetup({ invites: [buildInvite({ id: 'i1', email: 'carol@example.com' })] });
      cancelInvite.mockRejectedValue(apiError(404, 'invite_not_found'));
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Cancel invitation for carol@example.com' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('This invitation no longer exists.');
    });
  });

  describe('leaving', () => {
    it('asks first, then leaves and goes back to the games', async () => {
      const user = userEvent.setup();
      ownerSetup({ members: [ME, ALI] });
      leaveGame.mockResolvedValue(undefined);
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Leave game' }));
      const confirm = await dialog('Leave this game?');
      expect(leaveGame).not.toHaveBeenCalled();
      listGames.mockResolvedValue([]);
      await user.click(within(confirm).getByRole('button', { name: 'Leave game' }));

      await waitFor(() => expect(leaveGame).toHaveBeenCalledWith({ gameId: 'g1' }));
      expect(await screen.findByText('Your games page')).toBeInTheDocument();
    });

    it('explains the last-owner rule when the only owner tries, and stays', async () => {
      const user = userEvent.setup();
      ownerSetup();
      leaveGame.mockRejectedValue(apiError(409, 'last_owner'));
      renderTeam();

      await user.click(await screen.findByRole('button', { name: 'Leave game' }));
      const confirm = await dialog('Leave this game?');
      await user.click(within(confirm).getByRole('button', { name: 'Leave game' }));

      expect(await within(confirm).findByRole('alert')).toHaveTextContent('A game needs at least one owner. Make another developer the owner first.');
      expect(screen.queryByText('Your games page')).not.toBeInTheDocument();
    });
  });

  describe('when something is wrong', () => {
    it('announces loading', async () => {
      signIn();
      listGames.mockReturnValue(new Promise(() => {}));
      listMembers.mockReturnValue(new Promise(() => {}));

      renderTeam();

      expect(await screen.findByText('Loading the team')).toBeInTheDocument();
    });

    it('says the game was not found when it is not in the developer\'s list', async () => {
      signIn();
      listGames.mockResolvedValue([buildGame({ id: 'other' })]);
      listMembers.mockRejectedValue(apiError(404, 'game_not_found'));

      renderTeam();

      expect(await screen.findByText('Game not found')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to your games' })).toHaveAttribute('href', '/games');
    });

    it('offers a retry when the games cannot be loaded', async () => {
      const user = userEvent.setup();
      signIn();
      listGames.mockRejectedValueOnce(apiError(500, 'internal_error'));
      listMembers.mockResolvedValue([ME]);
      listGameInvites.mockResolvedValue([]);
      renderTeam();

      expect(await screen.findByText('Could not load your games')).toBeInTheDocument();
      listGames.mockResolvedValue([GAME]);
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByRole('heading', { name: /Team of Space Raiders/ })).toBeInTheDocument();
    });

    it('offers a retry when the team cannot be loaded', async () => {
      const user = userEvent.setup();
      signIn();
      listGames.mockResolvedValue([GAME]);
      listGameInvites.mockResolvedValue([]);
      listMembers.mockRejectedValueOnce(apiError(500, 'internal_error'));
      renderTeam();

      expect(await screen.findByText('Could not load the team')).toBeInTheDocument();
      listMembers.mockResolvedValue([ME, EMMA]);
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByRole('list', { name: 'Team members' })).toBeInTheDocument();
    });

    it('offers a retry when the invitations cannot be loaded', async () => {
      const user = userEvent.setup();
      ownerSetup();
      listGameInvites.mockRejectedValueOnce(apiError(500, 'internal_error'));
      renderTeam();

      expect(await screen.findByText('Could not load the invitations')).toBeInTheDocument();
      listGameInvites.mockResolvedValue([]);
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByText('No pending invitations')).toBeInTheDocument();
    });

    it('says only an owner can read the invitations when the role was lost since the page loaded (403 owner_required)', async () => {
      ownerSetup();
      listGameInvites.mockRejectedValue(apiError(403, 'owner_required'));

      renderTeam();

      expect(await screen.findByText('Could not load the invitations')).toBeInTheDocument();
      expect(screen.getByText('Only the game’s owner can do this.')).toBeInTheDocument();
      // Trying again would be refused the same way, so there is no button for it.
      expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    });
  });

  describe('with a suspended account', () => {
    it('is read-only: every write control is off and the page says why, but the team can be read', async () => {
      signIn(buildSuspendedDeveloper());
      listGames.mockResolvedValue([GAME]);
      listMembers.mockResolvedValue([ME, EMMA]);
      listGameInvites.mockResolvedValue([buildInvite({ email: 'carol@example.com' })]);

      renderTeam();

      const team = await screen.findByRole('list', { name: 'Team members' });
      expect(team).toHaveTextContent('Emma');
      expect(within(team).getByRole('button', { name: 'Remove Emma' })).toBeDisabled();
      expect(within(team).getByRole('button', { name: 'Make Emma the owner' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Leave game' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Send invitation' })).toBeDisabled();
      expect(await screen.findByRole('button', { name: 'Cancel invitation for carol@example.com' })).toBeDisabled();
      expect(screen.getAllByText(/account is suspended/i).length).toBeGreaterThan(0);
    });
  });
});

describe('TeamPage, as a member', () => {
  const MEMBER_GAME = buildGame({ id: 'g1', name: 'Space Raiders', role: 'member' });
  const memberSetup = () => {
    signIn();
    listGames.mockResolvedValue([MEMBER_GAME]);
    listMembers.mockResolvedValue([ALI, { ...ME, role: 'member', isOwner: false }, EMMA]);
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows the team and the role, but none of the owner\'s controls', async () => {
    memberSetup();

    renderTeam();

    expect(await screen.findByRole('heading', { name: /Team of Space Raiders/ })).toHaveTextContent('Member');
    const team = await screen.findByRole('list', { name: 'Team members' });
    expect(within(team).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /the owner$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Invite a developer' })).not.toBeInTheDocument();
    expect(screen.queryByText('Pending invitations')).not.toBeInTheDocument();
    expect(screen.getByText(/Only an owner of the game can invite developers/)).toBeInTheDocument();
  });

  it('never asks for the invitations: the server would answer 403', async () => {
    memberSetup();

    renderTeam();
    await screen.findByRole('list', { name: 'Team members' });

    expect(listGameInvites).not.toHaveBeenCalled();
  });

  it('can leave: asks first, then goes back to the games', async () => {
    const user = userEvent.setup();
    memberSetup();
    leaveGame.mockResolvedValue(undefined);
    renderTeam();

    await user.click(await screen.findByRole('button', { name: 'Leave game' }));
    const confirm = await dialog('Leave this game?');
    expect(confirm).toHaveTextContent('You lose access to Space Raiders at once');
    listGames.mockResolvedValue([]);
    await user.click(within(confirm).getByRole('button', { name: 'Leave game' }));

    await waitFor(() => expect(leaveGame).toHaveBeenCalledWith({ gameId: 'g1' }));
    expect(await screen.findByText('Your games page')).toBeInTheDocument();
  });
});
