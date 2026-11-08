import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listGames } from '@/features/games/api/gamesApi';
import { getWidgetDraft, listWidgetVersions, saveWidgetDraft } from '@/features/widget/api/widgetApi';
import { buildGame, buildWidgetConfig } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { WidgetEditorPage } from './WidgetEditorPage';

vi.mock('@/features/widget/api/widgetApi');
vi.mock('@/features/games/api/gamesApi');

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4];
const png = (name) => new File([Uint8Array.from(PNG_HEADER)], name, { type: 'image/png' });

const renderEditor = () =>
  renderWithRouter([{ path: '/games/:gameId/widget', element: <WidgetEditorPage /> }], { initialEntries: ['/games/g1/widget'] });

const setupUser = (options = {}) => userEvent.setup({ advanceTimers: vi.advanceTimersByTime, ...options });
const openTab = async (user, name) => user.click(await screen.findByRole('tab', { name }));
const rawText = () => screen.getByLabelText('Draft config (read-only JSON)').value;
const rawConfig = () => JSON.parse(rawText());
const widget = () => within(document.querySelector('[data-clan-ui]').shadowRoot.querySelector('.sk-root'));
const widgetRoot = () => document.querySelector('[data-clan-ui]').shadowRoot.querySelector('.sk-root');
const selectedTiles = () => screen.getAllByRole('switch').filter((tile) => tile.dataset.selected === 'true');

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.resetAllMocks();
  window.localStorage.clear();
  listGames.mockResolvedValue([buildGame({ id: 'g1', name: 'Space Raiders' })]);
  getWidgetDraft.mockResolvedValue(buildWidgetConfig());
  saveWidgetDraft.mockResolvedValue(undefined);
  listWidgetVersions.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('custom badges', () => {
  it('imports an image as a badge that is on, names it from the file, and keeps the image out of the config', async () => {
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Clan');

    await user.upload(screen.getByLabelText('Import badge image'), png('Dragon Badge.png'));

    const tile = await screen.findByRole('switch', { name: 'Dragon badge' });
    expect(tile).toBeChecked();
    expect(rawConfig().clan.badges.allowed).toEqual(['star', 'diamond', 'peak', 'spark', 'moon', 'cross', 'custom-dragon-badge']);
    expect(rawText()).not.toMatch(/data:image|base64/);
    expect(tile.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/^data:image\/png;base64,/));
    expect(screen.getByText('7 of 7 on')).toBeInTheDocument();
  });

  it('shows the imported badge to players in the preview, from the image kept in this browser', async () => {
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Clan');
    await user.upload(screen.getByLabelText('Import badge image'), png('Dragon.png'));
    await screen.findByRole('switch', { name: 'Dragon' });

    await user.click(screen.getByRole('button', { name: /Create/ }));

    const choice = widget().getByRole('radio', { name: 'Dragon' });
    expect(choice.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/^data:image\/png;base64,/));
  });

  it('gives the game the names to map, in a snippet it can copy', async () => {
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Clan');
    await user.upload(screen.getByLabelText('Import badge image'), png('Dragon.png'));
    await screen.findByRole('switch', { name: 'Dragon' });

    expect(screen.getByLabelText('SDK assets option')).toHaveTextContent("'custom-dragon': '/path/to/badges/dragon.png'");
    expect(screen.getByRole('button', { name: 'Copy snippet' })).toBeInTheDocument();
  });

  it('highlights one badge at a time, however many are on', async () => {
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Clan');

    expect(selectedTiles()).toHaveLength(0);

    await user.click(screen.getByRole('switch', { name: 'Moon' }));
    await user.click(screen.getByRole('switch', { name: 'Moon' }));

    expect(selectedTiles().map((tile) => tile.getAttribute('aria-label'))).toEqual(['Moon']);

    await user.click(screen.getByRole('switch', { name: 'Star' }));

    expect(selectedTiles().map((tile) => tile.getAttribute('aria-label'))).toEqual(['Star']);
    expect(screen.getByRole('switch', { name: 'Moon' })).toBeChecked();
  });

  it('removes an imported badge from the set, the preview and this browser', async () => {
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Clan');
    await user.upload(screen.getByLabelText('Import badge image'), png('Dragon.png'));
    await screen.findByRole('switch', { name: 'Dragon' });

    await user.click(screen.getByRole('button', { name: 'Remove Dragon' }));

    expect(screen.queryByRole('switch', { name: 'Dragon' })).not.toBeInTheDocument();
    expect(rawConfig().clan.badges.allowed).not.toContain('custom-dragon');
    expect(window.localStorage.getItem('clan.studio.assets.g1')).not.toContain('custom-dragon');
  });

  it('keeps the imported images for the next visit', async () => {
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Clan');
    await user.upload(screen.getByLabelText('Import badge image'), png('Dragon.png'));
    await screen.findByRole('switch', { name: 'Dragon' });
    cleanup();

    getWidgetDraft.mockResolvedValue(buildWidgetConfig((draft) => draft.clan.badges.allowed.push('custom-dragon')));
    renderEditor();
    await openTab(user, 'Clan');

    expect((await screen.findByRole('switch', { name: 'Dragon' })).querySelector('img')).not.toBeNull();
  });

  it('shows a name from the config whose image is not in this browser, with a way to see why', async () => {
    getWidgetDraft.mockResolvedValue(buildWidgetConfig((draft) => draft.clan.badges.allowed.push('custom-ember-flame')));
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Clan');

    const tile = await screen.findByRole('switch', { name: 'Ember flame' });
    await user.click(tile);

    expect(tile.querySelector('img')).toBeNull();
    expect(screen.getByText(/Not imported in this browser/)).toBeInTheDocument();
  });

  it('refuses a file that is not an image, and one that is too big, and says why', async () => {
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Clan');
    const input = screen.getByLabelText('Import badge image');

    await user.upload(input, new File(['just text'], 'notes.png', { type: 'image/png' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Use PNG, WebP or SVG');

    await user.upload(input, new File([new Uint8Array(70 * 1024).fill(1)], 'big.png', { type: 'image/png' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('too big'));
    expect(rawConfig().clan.badges.allowed).toHaveLength(6);
  });

  it('stops at 12 badges on', async () => {
    getWidgetDraft.mockResolvedValue(
      buildWidgetConfig((draft) => {
        draft.clan.badges.allowed = Array.from({ length: 12 }, (_, index) => `custom-b${index}`);
      }),
    );
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Clan');

    await user.click(screen.getByRole('switch', { name: 'Star' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Up to 12 badges');
    expect(rawConfig().clan.badges.allowed).toHaveLength(12);
  });
});

describe('custom textures', () => {
  const choosePanelTexture = async (user, name) => {
    await user.click(await within(screen.getByRole('group', { name: 'Panel frame' })).findByRole('radio', { name }));
  };

  it('imports a texture, offers it in every part, and saves only its name', async () => {
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Textures');

    await user.upload(screen.getByLabelText('Import texture'), png('Moss.png'));

    for (const slot of ['Panel frame', 'Content area', 'Buttons', 'Chat bubbles']) {
      expect(await within(screen.getByRole('group', { name: slot })).findByRole('radio', { name: 'Moss' })).toBeInTheDocument();
    }

    await choosePanelTexture(user, 'Moss');

    expect(rawConfig().theme.textures.panel).toEqual({ asset: 'custom-moss', fit: 'tile', strength: 'subtle' });
    expect(rawText()).not.toMatch(/data:image|base64/);
    expect(screen.getByLabelText('SDK assets option')).toHaveTextContent("'custom-moss': '/path/to/textures/moss.png'");
  });

  it('draws the texture on the preview panel, under a translucent layer', async () => {
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Textures');
    await user.upload(screen.getByLabelText('Import texture'), png('Moss.png'));
    await choosePanelTexture(user, 'Moss');

    await waitFor(() => expect(widgetRoot().style.getPropertyValue('--sk-tex-panel')).toMatch(/^linear-gradient\(rgba\(.*\), rgba\(.*\)\), url\("data:image\/png;base64,/));
  });

  it('removes a texture everywhere it is used', async () => {
    const user = setupUser();
    renderEditor();
    await openTab(user, 'Textures');
    await user.upload(screen.getByLabelText('Import texture'), png('Moss.png'));
    await choosePanelTexture(user, 'Moss');

    await user.click(screen.getByRole('button', { name: 'Remove Moss' }));

    expect(rawConfig().theme.textures.panel).toBeUndefined();
    expect(within(screen.getByRole('group', { name: 'Panel frame' })).queryByRole('radio', { name: 'Moss' })).not.toBeInTheDocument();
  });

  it('refuses an SVG for a texture', async () => {
    const user = setupUser({ applyAccept: false });
    renderEditor();
    await openTab(user, 'Textures');

    await user.upload(screen.getByLabelText('Import texture'), new File(['<svg></svg>'], 'flat.svg', { type: 'image/svg+xml' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Use PNG or WebP');
  });
});
