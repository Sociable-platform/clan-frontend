import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listGames, registerGame } from '@/features/games/api/gamesApi';
import { ApiError } from '@/shared/api';
import { buildGame } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { GamesPage } from './GamesPage';

vi.mock('@/features/games/api/gamesApi');

function renderGames() {
  return renderWithRouter([{ path: '/games', element: <GamesPage /> }], {
    initialEntries: ['/games'],
  });
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

    expect(await screen.findByRole('link', { name: 'Space Raiders' })).toBeInTheDocument();
  });

  it('lists games and links each one to its API keys', async () => {
    listGames.mockResolvedValue([buildGame({ id: 'g1', name: 'Space Raiders' })]);

    renderGames();

    expect(await screen.findByRole('link', { name: 'Space Raiders' })).toHaveAttribute('href', '/games/g1');
  });

  it('says "Register existing game" and never "Create game"', async () => {
    listGames.mockResolvedValue([]);

    renderGames();

    expect(await screen.findByRole('heading', { name: 'Register existing game' })).toBeInTheDocument();
    expect(screen.queryByText(/create game/i)).not.toBeInTheDocument();
  });

  it('validates the name before calling the server', async () => {
    listGames.mockResolvedValue([]);
    renderGames();

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Register game' }));

    expect(screen.getByText('Enter the game name')).toBeInTheDocument();
    expect(registerGame).not.toHaveBeenCalled();
  });

  it('registers a game, clears the form and refreshes the list', async () => {
    const user = userEvent.setup();
    listGames.mockResolvedValueOnce([]).mockResolvedValue([buildGame({ name: 'Farm Clicker' })]);
    registerGame.mockResolvedValue(buildGame({ name: 'Farm Clicker' }));
    renderGames();

    await user.type(await screen.findByLabelText('Game name'), 'Farm Clicker');
    await user.click(screen.getByRole('button', { name: 'Register game' }));

    expect(registerGame).toHaveBeenCalledWith({ name: 'Farm Clicker', description: '' });
    expect(await screen.findByRole('link', { name: 'Farm Clicker' })).toBeInTheDocument();
    expect(screen.getByLabelText('Game name')).toHaveValue('');
  });

  it('shows a server validation error next to its field', async () => {
    const user = userEvent.setup();
    listGames.mockResolvedValue([]);
    registerGame.mockRejectedValue(
      new ApiError({ status: 400, code: 'invalid_name', message: 'Game name must be 1 to 100 characters' }),
    );
    renderGames();

    await user.type(await screen.findByLabelText('Game name'), 'x');
    await user.click(screen.getByRole('button', { name: 'Register game' }));

    expect(await screen.findByText('Game name must be 1 to 100 characters')).toBeInTheDocument();
  });
});
