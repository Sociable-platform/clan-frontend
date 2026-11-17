import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listGames, registerGame } from '@/features/games/api/gamesApi';
import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/store';
import { buildDeveloper, buildGame, buildSuspendedDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { GamesPage } from './GamesPage';

vi.mock('@/features/games/api/gamesApi');

function renderGames() {
  return renderWithRouter([{ path: '/games', element: <GamesPage /> }], {
    initialEntries: ['/games'],
  });
}

/** Presses Register game in the page header and returns the dialog it opens. */
async function openRegisterDialog(user) {
  await user.click(await screen.findByRole('button', { name: 'Register game' }));
  return screen.findByRole('dialog', { name: 'Register existing game' });
}

describe('GamesPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('announces loading while the games are fetched', () => {
    listGames.mockReturnValue(new Promise(() => {}));

    renderGames();

    expect(screen.getByRole('status')).toHaveTextContent('Loading games');
  });

  it('shows an empty state when the developer has no games', async () => {
    listGames.mockResolvedValue([]);

    renderGames();

    expect(await screen.findByText('No games yet')).toBeInTheDocument();
  });

  it('shows an error with a retry that loads the games', async () => {
    listGames.mockRejectedValueOnce(new ApiError({ status: 500, code: 'internal', message: 'boom' }));
    listGames.mockResolvedValueOnce([buildGame()]);
    renderGames();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your games');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('rowheader', { name: /^Space Raiders/ })).toBeInTheDocument();
  });

  it('says what the page is for under the title', async () => {
    listGames.mockResolvedValue([]);

    renderGames();

    expect(await screen.findByRole('heading', { level: 1, name: 'Your games' })).toBeInTheDocument();
    expect(screen.getByText('Connect a game with an API key, then shape its widget.')).toBeInTheDocument();
  });

  it('filters the games by name or ID as you type in the search box', async () => {
    const user = userEvent.setup();
    listGames.mockResolvedValue([
      buildGame({ id: 'g1', name: 'Space Raiders' }),
      buildGame({ id: 'g2', name: 'Farm Clicker', description: '' }),
    ]);
    renderGames();
    const search = await screen.findByRole('searchbox', { name: 'Search games' });

    await user.type(search, 'farm');
    expect(screen.getByRole('rowheader', { name: /^Farm Clicker/ })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /^Space Raiders/ })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'g1');
    expect(screen.getByRole('rowheader', { name: /^Space Raiders/ })).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'zzz');
    expect(screen.getByText('No games match your search')).toBeInTheDocument();
  });

  it('has no search box while there are no games', async () => {
    listGames.mockResolvedValue([]);

    renderGames();

    await screen.findByText('No games yet');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('says "No description" for a game without one and shows the date it was registered', async () => {
    listGames.mockResolvedValue([buildGame({ description: '', createdAt: '2026-11-07T09:30:00Z' })]);

    renderGames();

    const row = (await screen.findByRole('rowheader', { name: /^Space Raiders/ })).closest('tr');
    expect(within(row).getByText('No description')).toBeInTheDocument();
    expect(within(row).getByText('Nov 7, 2026')).toBeInTheDocument();
  });

  it('shows each game\'s ID with a button that copies it', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    listGames.mockResolvedValue([buildGame({ id: 'g1', name: 'Space Raiders' })]);
    renderGames();

    expect(await screen.findByLabelText('Game ID of Space Raiders')).toHaveTextContent('g1');
    await user.click(screen.getByRole('button', { name: 'Copy ID' }));

    expect(writeText).toHaveBeenCalledWith('g1');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('gives each game a link to its widget editor and a button for its API keys', async () => {
    listGames.mockResolvedValue([buildGame({ id: 'g1', name: 'Space Raiders' })]);

    renderGames();

    expect(await screen.findByRole('link', { name: 'Customize widget' })).toHaveAttribute('href', '/games/g1/widget');
    expect(screen.getByRole('button', { name: 'API keys' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('says "Register existing game" and never "Create game"', async () => {
    listGames.mockResolvedValue([]);

    renderGames();

    expect(await openRegisterDialog(userEvent.setup())).toBeInTheDocument();
    expect(screen.queryByText(/create game/i)).not.toBeInTheDocument();
  });

  it('keeps the register form out of the page until Register game is pressed', async () => {
    listGames.mockResolvedValue([]);

    renderGames();

    await screen.findByText('No games yet');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Game name')).not.toBeInTheDocument();
  });

  it('closes the dialog on Cancel and forgets what was typed', async () => {
    const user = userEvent.setup();
    listGames.mockResolvedValue([]);
    renderGames();

    const dialog = await openRegisterDialog(user);
    await user.type(within(dialog).getByLabelText('Game name'), 'Farm Clicker');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(registerGame).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Register game' })).toHaveFocus();
    await openRegisterDialog(user);
    expect(screen.getByLabelText('Game name')).toHaveValue('');
  });

  it('validates the name before calling the server', async () => {
    const user = userEvent.setup();
    listGames.mockResolvedValue([]);
    renderGames();

    const dialog = await openRegisterDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Register game' }));

    expect(screen.getByText('Enter the game name')).toBeInTheDocument();
    expect(registerGame).not.toHaveBeenCalled();
  });

  it('registers a game, closes the dialog and refreshes the list', async () => {
    const user = userEvent.setup();
    listGames.mockResolvedValueOnce([]).mockResolvedValue([buildGame({ name: 'Farm Clicker' })]);
    registerGame.mockResolvedValue(buildGame({ name: 'Farm Clicker' }));
    renderGames();

    const dialog = await openRegisterDialog(user);
    await user.type(within(dialog).getByLabelText('Game name'), 'Farm Clicker');
    await user.click(within(dialog).getByRole('button', { name: 'Register game' }));

    expect(registerGame).toHaveBeenCalledWith({ name: 'Farm Clicker', description: '' });
    expect(await screen.findByRole('rowheader', { name: /^Farm Clicker/ })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await openRegisterDialog(user);
    expect(screen.getByLabelText('Game name')).toHaveValue('');
  });

  it('shows a server validation error next to its field', async () => {
    const user = userEvent.setup();
    listGames.mockResolvedValue([]);
    registerGame.mockRejectedValue(
      new ApiError({ status: 400, code: 'invalid_name', message: 'Game name must be 1 to 100 characters' }),
    );
    renderGames();

    const dialog = await openRegisterDialog(user);
    await user.type(within(dialog).getByLabelText('Game name'), 'x');
    await user.click(within(dialog).getByRole('button', { name: 'Register game' }));

    expect(await screen.findByText('Game name must be 1 to 100 characters')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  describe('for a suspended developer', () => {
    beforeEach(() => {
      useAuthStore.getState().startSession({
        token: 't',
        expiresAt: Date.now() + 60_000,
        developer: buildSuspendedDeveloper(),
      });
      listGames.mockResolvedValue([buildGame()]);
    });

    it('lists the games but turns Register game off and says why', async () => {
      renderGames();

      expect(await screen.findByRole('rowheader', { name: /^Space Raiders/ })).toBeInTheDocument();
      const open = screen.getByRole('button', { name: 'Register game' });
      expect(open).toBeDisabled();
      expect(open).toHaveAccessibleDescription(/suspended, so changes are turned off/i);
    });

    it('does not open the dialog or register a game when the button is pressed anyway', async () => {
      renderGames();
      await screen.findByRole('rowheader', { name: /^Space Raiders/ });

      await userEvent.setup().click(screen.getByRole('button', { name: 'Register game' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(registerGame).not.toHaveBeenCalled();
    });
  });

  it('shows no "try again" error when the refused registration is what reveals the suspension', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer: buildDeveloper() });
    listGames.mockResolvedValue([]);
    registerGame.mockImplementation(async () => {
      useAuthStore.getState().markDeveloperSuspended();
      throw new ApiError({ status: 403, code: 'account_suspended', message: 'Your account is suspended.' });
    });
    renderGames();

    const dialog = await openRegisterDialog(user);
    await user.type(within(dialog).getByLabelText('Game name'), 'Space Raiders');
    await user.click(within(dialog).getByRole('button', { name: 'Register game' }));

    expect(await within(dialog).findByText(/suspended, so changes are turned off/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Register game' })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('still shows a registration error to an active developer', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer: buildDeveloper() });
    listGames.mockResolvedValue([]);
    registerGame.mockRejectedValue(new ApiError({ status: 500, code: 'internal', message: 'boom' }));
    renderGames();

    const dialog = await openRegisterDialog(user);
    await user.type(within(dialog).getByLabelText('Game name'), 'Space Raiders');
    await user.click(within(dialog).getByRole('button', { name: 'Register game' }));

    expect(await within(dialog).findByRole('alert')).toBeInTheDocument();
  });

  it('keeps Register game on for an active developer', async () => {
    useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer: buildDeveloper() });
    listGames.mockResolvedValue([]);

    renderGames();

    await screen.findByText('No games yet');
    expect(screen.getByRole('button', { name: 'Register game' })).toBeEnabled();
  });
});
