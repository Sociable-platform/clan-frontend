import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApiKey, listApiKeys, revokeApiKey } from '@/features/apiKeys/api/apiKeysApi';
import { listGames } from '@/features/games/api/gamesApi';
import { ApiError } from '@/shared/api';
import { buildApiKey, buildGame, buildNewApiKey } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { GameDetailPage } from './GameDetailPage';

vi.mock('@/features/apiKeys/api/apiKeysApi');
vi.mock('@/features/games/api/gamesApi');

const GAME = buildGame({ id: 'g1', name: 'Space Raiders' });

function renderDetail() {
  return renderWithRouter([{ path: '/games/:gameId', element: <GameDetailPage /> }], {
    initialEntries: ['/games/g1'],
  });
}

describe('GameDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listGames.mockResolvedValue([GAME]);
  });

  it('announces loading while the keys are fetched', () => {
    listApiKeys.mockReturnValue(new Promise(() => {}));

    renderDetail();

    expect(screen.getByRole('status')).toHaveTextContent('Loading API keys');
  });

  it('shows an empty state when the game has no keys', async () => {
    listApiKeys.mockResolvedValue([]);

    renderDetail();

    expect(await screen.findByText('No API keys yet')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Space Raiders' })).toBeInTheDocument();
  });

  it('shows an error with a retry', async () => {
    listApiKeys.mockRejectedValueOnce(new ApiError({ status: 500, code: 'internal', message: 'boom' }));
    listApiKeys.mockResolvedValueOnce([buildApiKey()]);
    renderDetail();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load API keys');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(/clk_Ab3x/)).toBeInTheDocument();
  });

  it('links to the widget editor of the game', async () => {
    listApiKeys.mockResolvedValue([]);

    renderDetail();

    expect(await screen.findByRole('link', { name: 'Customize widget' })).toHaveAttribute(
      'href',
      '/games/g1/widget',
    );
  });

  it('shows a not-found state for a missing or foreign game', async () => {
    listApiKeys.mockRejectedValue(
      new ApiError({ status: 404, code: 'game_not_found', message: 'Game not found' }),
    );

    renderDetail();

    expect(await screen.findByRole('alert')).toHaveTextContent('Game not found');
    expect(screen.queryByRole('button', { name: 'Create API key' })).not.toBeInTheDocument();
  });

  it('lists active and revoked keys, with Revoke only on active ones', async () => {
    listApiKeys.mockResolvedValue([
      buildApiKey({ id: 'k1', keyPrefix: 'clk_Aaaa' }),
      buildApiKey({ id: 'k2', keyPrefix: 'clk_Bbbb', isRevoked: true, revokedAt: '2026-11-08T08:00:00Z' }),
    ]);

    renderDetail();

    const rows = await screen.findAllByRole('listitem');
    expect(within(rows[0]).getByRole('button', { name: 'Revoke key clk_Aaaa' })).toBeInTheDocument();
    expect(within(rows[1]).getByText('Revoked')).toBeInTheDocument();
    expect(within(rows[1]).queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a new key once with a warning and a copy button', async () => {
    const user = userEvent.setup();
    listApiKeys.mockResolvedValue([]);
    createApiKey.mockResolvedValue(buildNewApiKey());
    renderDetail();

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
    renderDetail();

    await user.click(await screen.findByRole('button', { name: 'Create API key' }));
    await user.click(await screen.findByRole('button', { name: 'I have saved the key' }));

    const row = await screen.findByRole('listitem');
    expect(row).toHaveTextContent('clk_Ab3x…');
    expect(row).not.toHaveTextContent(buildNewApiKey().key);
  });

  it('shows an error when the key cannot be created', async () => {
    const user = userEvent.setup();
    listApiKeys.mockResolvedValue([]);
    createApiKey.mockRejectedValue(new ApiError({ status: 500, code: 'internal', message: 'boom' }));
    renderDetail();

    await user.click(await screen.findByRole('button', { name: 'Create API key' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not create the API key');
  });

  it('asks for confirmation before revoking and does nothing on cancel', async () => {
    const user = userEvent.setup();
    listApiKeys.mockResolvedValue([buildApiKey({ id: 'k1' })]);
    renderDetail();

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
    renderDetail();

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
    renderDetail();

    await user.click(await screen.findByRole('button', { name: 'Revoke key clk_Ab3x' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Revoke key' }));

    expect(await within(screen.getByRole('alertdialog')).findByRole('alert')).toHaveTextContent(
      'Could not revoke the key',
    );
  });
});
