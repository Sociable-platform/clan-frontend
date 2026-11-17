import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApiKey, listApiKeys, revokeApiKey } from '@/features/apiKeys/api/apiKeysApi';
import { listGames } from '@/features/games/api/gamesApi';
import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/store';
import { buildApiKey, buildDeveloper, buildGame, buildNewApiKey, buildSuspendedDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { GamesPage } from './GamesPage';

vi.mock('@/features/apiKeys/api/apiKeysApi');
vi.mock('@/features/games/api/gamesApi');

const GAME = buildGame({ id: 'g1', name: 'Space Raiders' });

/** The games page with Space Raiders' API keys open, as a link from the widget editor opens it. */
function renderKeys() {
  return renderWithRouter([{ path: '/games', element: <GamesPage /> }], {
    initialEntries: ['/games?keys=g1'],
  });
}

const findPanel = () => screen.findByRole('region', { name: 'API keys of Space Raiders' });

describe('GamesPage, a game\'s API keys', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listGames.mockResolvedValue([GAME]);
  });

  it('opens a game\'s keys under its row and closes them again', async () => {
    const user = userEvent.setup();
    listApiKeys.mockResolvedValue([buildApiKey()]);
    renderWithRouter([{ path: '/games', element: <GamesPage /> }], { initialEntries: ['/games'] });

    const toggle = await screen.findByRole('button', { name: 'API keys' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(listApiKeys).not.toHaveBeenCalled();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await within(await findPanel()).findByText(/clk_Ab3x/)).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByRole('region', { name: 'API keys of Space Raiders' })).not.toBeInTheDocument();
  });

  it('keeps one game open at a time', async () => {
    const user = userEvent.setup();
    listGames.mockResolvedValue([GAME, buildGame({ id: 'g2', name: 'Farm Clicker' })]);
    listApiKeys.mockResolvedValue([]);
    renderKeys();
    await findPanel();

    await user.click(screen.getAllByRole('button', { name: 'API keys' })[1]);

    expect(await screen.findByRole('region', { name: 'API keys of Farm Clicker' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'API keys of Space Raiders' })).not.toBeInTheDocument();
  });

  it('opens nothing when the address names a game that is not in the list', async () => {
    renderWithRouter([{ path: '/games', element: <GamesPage /> }], { initialEntries: ['/games?keys=unknown'] });

    expect(await screen.findByRole('heading', { name: 'Space Raiders' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /API keys of/ })).not.toBeInTheDocument();
    expect(listApiKeys).not.toHaveBeenCalled();
  });

  it('announces loading while the keys are fetched', async () => {
    listApiKeys.mockReturnValue(new Promise(() => {}));

    renderKeys();

    expect(await within(await findPanel()).findByText('Loading API keys')).toBeInTheDocument();
  });

  it('shows an empty state when the game has no keys', async () => {
    listApiKeys.mockResolvedValue([]);

    renderKeys();

    expect(await screen.findByText('No API keys yet')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Space Raiders' })).toBeInTheDocument();
  });

  it('shows an error with a retry', async () => {
    listApiKeys.mockRejectedValueOnce(new ApiError({ status: 500, code: 'internal', message: 'boom' }));
    listApiKeys.mockResolvedValueOnce([buildApiKey()]);
    renderKeys();

    expect(await within(await findPanel()).findByRole('alert')).toHaveTextContent('Could not load API keys');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(/clk_Ab3x/)).toBeInTheDocument();
  });

  it('shows a not-found state for a missing or foreign game', async () => {
    listApiKeys.mockRejectedValue(
      new ApiError({ status: 404, code: 'game_not_found', message: 'Game not found' }),
    );

    renderKeys();

    expect(await within(await findPanel()).findByRole('alert')).toHaveTextContent('Game not found');
    expect(screen.queryByRole('button', { name: 'Create API key' })).not.toBeInTheDocument();
  });

  it('lists active and revoked keys, with Revoke only on active ones', async () => {
    listApiKeys.mockResolvedValue([
      buildApiKey({ id: 'k1', keyPrefix: 'clk_Aaaa' }),
      buildApiKey({ id: 'k2', keyPrefix: 'clk_Bbbb', isRevoked: true, revokedAt: '2026-11-08T08:00:00Z' }),
    ]);

    renderKeys();

    const rows = await within(await findPanel()).findAllByRole('listitem');
    expect(within(rows[0]).getByRole('button', { name: 'Revoke key clk_Aaaa' })).toBeInTheDocument();
    expect(within(rows[1]).getByText('Revoked')).toBeInTheDocument();
    expect(within(rows[1]).queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a new key once with a warning and a copy button', async () => {
    const user = userEvent.setup();
    listApiKeys.mockResolvedValue([]);
    createApiKey.mockResolvedValue(buildNewApiKey());
    renderKeys();

    await user.click(await screen.findByRole('button', { name: 'Create API key' }));

    expect(await screen.findByLabelText('New API key')).toHaveTextContent(buildNewApiKey().key);
    expect(screen.getByText(/shown only once/)).toHaveTextContent('Keep it on your game server');
    await user.click(screen.getByRole('button', { name: 'Copy key' }));
    expect(await navigator.clipboard.readText()).toBe(buildNewApiKey().key);

    await user.click(screen.getByRole('button', { name: 'I have saved the key' }));
    expect(screen.queryByLabelText('New API key')).not.toBeInTheDocument();
  });

  it('refreshes the list after creating a key and lists only the prefix', async () => {
    const user = userEvent.setup();
    listApiKeys.mockResolvedValueOnce([]).mockResolvedValue([buildApiKey()]);
    createApiKey.mockResolvedValue(buildNewApiKey());
    renderKeys();

    await user.click(await screen.findByRole('button', { name: 'Create API key' }));
    await user.click(await screen.findByRole('button', { name: 'I have saved the key' }));

    const row = await within(await findPanel()).findByRole('listitem');
    expect(row).toHaveTextContent('clk_Ab3x…');
    expect(row).not.toHaveTextContent(buildNewApiKey().key);
  });

  it('shows an error when the key cannot be created', async () => {
    const user = userEvent.setup();
    listApiKeys.mockResolvedValue([]);
    createApiKey.mockRejectedValue(new ApiError({ status: 500, code: 'internal', message: 'boom' }));
    renderKeys();

    await user.click(await screen.findByRole('button', { name: 'Create API key' }));

    expect(await within(await findPanel()).findByRole('alert')).toHaveTextContent('Could not create the API key');
  });

  it('asks for confirmation before revoking and does nothing on cancel', async () => {
    const user = userEvent.setup();
    listApiKeys.mockResolvedValue([buildApiKey({ id: 'k1' })]);
    renderKeys();

    await user.click(await screen.findByRole('button', { name: 'Revoke key clk_Ab3x' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Revoke this API key?' });
    expect(dialog).toHaveTextContent('stops working immediately');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(revokeApiKey).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('revokes the key after confirmation and refreshes the list', async () => {
    const user = userEvent.setup();
    listApiKeys
      .mockResolvedValueOnce([buildApiKey({ id: 'k1' })])
      .mockResolvedValue([buildApiKey({ id: 'k1', isRevoked: true, revokedAt: '2026-11-08T08:00:00Z' })]);
    revokeApiKey.mockResolvedValue(undefined);
    renderKeys();

    await user.click(await screen.findByRole('button', { name: 'Revoke key clk_Ab3x' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Revoke key' }));

    expect(revokeApiKey).toHaveBeenCalledWith({ keyId: 'k1' });
    expect(await screen.findByText('Revoked')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('keeps the dialog open with an error when revoking fails', async () => {
    const user = userEvent.setup();
    listApiKeys.mockResolvedValue([buildApiKey({ id: 'k1' })]);
    revokeApiKey.mockRejectedValue(new ApiError({ status: 500, code: 'internal', message: 'boom' }));
    renderKeys();

    await user.click(await screen.findByRole('button', { name: 'Revoke key clk_Ab3x' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Revoke key' }));

    expect(await within(screen.getByRole('alertdialog')).findByRole('alert')).toHaveTextContent(
      'Could not revoke the key',
    );
  });

  describe('for a suspended developer', () => {
    beforeEach(() => {
      useAuthStore.getState().startSession({
        token: 't',
        expiresAt: Date.now() + 60_000,
        developer: buildSuspendedDeveloper(),
      });
    });

    it('turns Create API key off and says why, but still lists the keys', async () => {
      listApiKeys.mockResolvedValue([buildApiKey({ id: 'k1', keyPrefix: 'clk_Aaaa' })]);
      renderKeys();

      const create = await screen.findByRole('button', { name: 'Create API key' });

      expect(create).toBeDisabled();
      expect(create).toHaveAccessibleDescription(/suspended, so changes are turned off/i);
      expect(await screen.findByText(/clk_Aaaa/)).toBeInTheDocument();
      expect(createApiKey).not.toHaveBeenCalled();
    });

    it('still lets the developer revoke a key, which the backend allows', async () => {
      const user = userEvent.setup();
      listApiKeys.mockResolvedValue([buildApiKey({ id: 'k1', keyPrefix: 'clk_Aaaa' })]);
      revokeApiKey.mockResolvedValue(undefined);
      renderKeys();

      await user.click(await screen.findByRole('button', { name: 'Revoke key clk_Aaaa' }));
      await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: /^Revoke/ }));

      expect(revokeApiKey).toHaveBeenCalledWith({ keyId: 'k1' });
    });
  });

  it('shows no "Try again" error when the refused create is what reveals the suspension', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer: buildDeveloper() });
    listApiKeys.mockResolvedValue([]);
    // The HTTP client marks the developer suspended when it sees the 403, before the request rejects.
    createApiKey.mockImplementation(async () => {
      useAuthStore.getState().markDeveloperSuspended();
      throw new ApiError({ status: 403, code: 'account_suspended', message: 'Your account is suspended.' });
    });
    renderKeys();

    await user.click(await screen.findByRole('button', { name: 'Create API key' }));

    expect(await within(await findPanel()).findByText(/suspended, so changes are turned off/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create API key' })).toBeDisabled();
    expect(screen.queryByText(/Could not create the API key/)).not.toBeInTheDocument();
  });

  it('keeps Create API key on for an active developer', async () => {
    useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer: buildDeveloper() });
    listApiKeys.mockResolvedValue([]);

    renderKeys();

    expect(await screen.findByRole('button', { name: 'Create API key' })).toBeEnabled();
  });
});
