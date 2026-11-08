import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listGames } from '@/features/games/api/gamesApi';
import { getWidgetDraft, saveWidgetDraft } from '@/features/widget/api/widgetApi';
import { WIDGET_AUTOSAVE_DELAY_MS } from '@/features/widget/config/widgetConfig';
import { ApiError } from '@/shared/api';
import { buildGame, buildWidgetConfig } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { WidgetEditorPage } from './WidgetEditorPage';

vi.mock('@/features/widget/api/widgetApi');
vi.mock('@/features/games/api/gamesApi');

const GAME = buildGame({ id: 'g1', name: 'Space Raiders' });

function renderEditor() {
  return renderWithRouter([{ path: '/games/:gameId/widget', element: <WidgetEditorPage /> }], {
    initialEntries: ['/games/g1/widget'],
  });
}

const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const waitForAutosave = () => act(() => vi.advanceTimersByTimeAsync(WIDGET_AUTOSAVE_DELAY_MS));
const openSection = async (user, name) => user.click(await screen.findByRole('button', { name }));

async function replaceValue(user, field, value) {
  await user.clear(field);
  await user.type(field, value);
}

const rejected = (details) =>
  new ApiError({ status: 400, code: 'invalid_widget_config', message: 'Invalid config', details });

describe('WidgetEditorPage', () => {
  beforeEach(() => {
    // Time moves by itself too, so findBy* still works; the 3 s autosave is advanced by hand.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.resetAllMocks();
    listGames.mockResolvedValue([GAME]);
    getWidgetDraft.mockResolvedValue(buildWidgetConfig());
    saveWidgetDraft.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('loading the draft', () => {
    it('announces loading while the draft is fetched', () => {
      getWidgetDraft.mockReturnValue(new Promise(() => {}));

      renderEditor();

      expect(screen.getByRole('status')).toHaveTextContent('Loading the widget draft');
    });

    it('shows the draft values in the form, under the game name', async () => {
      renderEditor();

      expect(await screen.findByRole('heading', { name: 'Widget · Space Raiders' })).toBeInTheDocument();
      expect(screen.getByLabelText('Brand')).toHaveValue('#80EAFF');
      expect(screen.getByLabelText('Heading font')).toHaveValue('Unbounded');
      expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(getWidgetDraft).toHaveBeenCalledWith(expect.objectContaining({ gameId: 'g1' }));
    });

    it('shows an error with a retry when the draft cannot be loaded', async () => {
      const user = setupUser();
      getWidgetDraft
        .mockRejectedValueOnce(new ApiError({ status: 500, code: 'internal', message: 'boom' }))
        .mockResolvedValueOnce(buildWidgetConfig());
      renderEditor();

      expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the widget draft');
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByLabelText('Brand')).toBeInTheDocument();
    });

    it('shows a not-found state for a missing or foreign game', async () => {
      getWidgetDraft.mockRejectedValue(new ApiError({ status: 404, code: 'game_not_found', message: 'Game not found' }));

      renderEditor();

      expect(await screen.findByRole('alert')).toHaveTextContent('Game not found');
      expect(screen.queryByRole('navigation', { name: 'Widget sections' })).not.toBeInTheDocument();
    });
  });

  describe('editing', () => {
    it('updates the draft and saves it after the autosave delay', async () => {
      const user = setupUser();
      renderEditor();
      await openSection(user, 'Clan');

      await replaceValue(user, screen.getByLabelText('Max members'), '12');
      expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');
      expect(saveWidgetDraft).not.toHaveBeenCalled();
      await waitForAutosave();

      expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
      expect(saveWidgetDraft).toHaveBeenCalledWith({
        gameId: 'g1',
        config: buildWidgetConfig((config) => {
          config.clan.maxMembers = 12;
        }),
      });
      expect(screen.getByRole('status')).toHaveTextContent('Saved');
    });

    it('keeps the edit when moving between sections', async () => {
      const user = setupUser();
      renderEditor();
      await openSection(user, 'Chat');
      await user.click(screen.getByRole('radio', { name: 'Log' }));

      await openSection(user, 'Style');
      await openSection(user, 'Chat');

      expect(screen.getByRole('radio', { name: 'Log' })).toBeChecked();
    });

    it('edits colours, fonts, switches, toggles and textures into the config', async () => {
      const user = setupUser();
      renderEditor();

      await replaceValue(user, await screen.findByLabelText('Brand'), '#2e8b57');
      await user.selectOptions(screen.getByLabelText('Body font'), 'Fredoka');
      await user.click(screen.getByRole('radio', { name: 'Light' }));
      await user.click(screen.getByRole('switch', { name: 'Uppercase labels' }));
      await user.selectOptions(screen.getByRole('combobox', { name: 'Panel frame' }), 'None');
      await user.selectOptions(screen.getByRole('combobox', { name: 'Buttons' }), 'Carbon');
      await openSection(user, 'Advanced');

      const json = JSON.parse(screen.getByLabelText('Draft config (read-only JSON)').value);
      expect(json.theme.colors.brand).toBe('#2E8B57');
      expect(json.theme.fonts.body.family).toBe('Fredoka');
      expect(json.theme.mode).toBe('light');
      expect(json.theme.buttons.case).toBe('upper');
      expect(json.theme.textures.panel).toBeUndefined();
      expect(json.theme.textures.button).toEqual({ asset: 'tex_carbon', fit: 'tile', strength: 'subtle' });
    });

    it('turns badges on and off', async () => {
      const user = setupUser();
      renderEditor();
      await openSection(user, 'Clan');

      await user.click(screen.getByRole('switch', { name: '☾ Moon' }));
      await user.click(screen.getByRole('switch', { name: '★ Star' }));
      await openSection(user, 'Advanced');

      const json = JSON.parse(screen.getByLabelText('Draft config (read-only JSON)').value);
      expect(json.clan.badges.allowed).toEqual(['diamond', 'peak', 'spark', 'cross']);
    });

    it('shows the default text as a hint and stores only labels that were changed', async () => {
      const user = setupUser();
      renderEditor();
      await openSection(user, 'Texts');

      expect(screen.getByLabelText('Leave')).toHaveAttribute('placeholder', 'Leave clan');
      await replaceValue(user, screen.getByLabelText('Name (singular)'), 'Guild');
      expect(screen.getByLabelText('Leave')).toHaveAttribute('placeholder', 'Leave guild');
      await user.type(screen.getByLabelText('Send'), 'Fire');
      await user.clear(screen.getByLabelText('Panel title'));
      await openSection(user, 'Advanced');

      const { texts } = JSON.parse(screen.getByLabelText('Draft config (read-only JSON)').value);
      expect(texts.terms.clan).toBe('Guild');
      expect(texts.labels).toEqual({ createCta: '+ Start a {clan}', send: 'Fire' });
    });

    it('resets the texts to the defaults', async () => {
      const user = setupUser();
      renderEditor();
      await openSection(user, 'Texts');

      await user.click(screen.getByRole('button', { name: 'Reset texts to defaults' }));
      await openSection(user, 'Advanced');

      const { texts } = JSON.parse(screen.getByLabelText('Draft config (read-only JSON)').value);
      expect(texts).toEqual({ terms: { clan: 'Clan', clans: 'Clans' }, labels: {} });
    });
  });

  describe('save status', () => {
    it('shows saving while the request is in flight', async () => {
      const user = setupUser();
      let finish;
      saveWidgetDraft.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      renderEditor();
      await openSection(user, 'Chat');
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));

      await waitForAutosave();
      expect(screen.getByRole('status')).toHaveTextContent('Saving…');

      await act(async () => finish());
      expect(screen.getByRole('status')).toHaveTextContent('Saved');
    });

    it('shows an error with the reason and a retry that saves again', async () => {
      const user = setupUser();
      saveWidgetDraft
        .mockRejectedValueOnce(new ApiError({ status: 0, code: 'network_error', message: 'Cannot reach the server.' }))
        .mockResolvedValue(undefined);
      renderEditor();
      await openSection(user, 'Chat');
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));
      await waitForAutosave();

      expect(screen.getByText('Could not save')).toBeInTheDocument();
      expect(screen.getByText('Cannot reach the server.')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByText('Saved')).toBeInTheDocument();
      expect(saveWidgetDraft).toHaveBeenCalledTimes(2);
      expect(screen.queryByText('Cannot reach the server.')).not.toBeInTheDocument();
    });
  });

  describe('server validation errors', () => {
    it('shows the message next to the field it belongs to', async () => {
      const user = setupUser();
      saveWidgetDraft.mockRejectedValue(
        rejected([{ path: '/clan/maxMembers', rule: 'maximum', message: 'must be at most 200' }]),
      );
      renderEditor();
      await openSection(user, 'Clan');

      await replaceValue(user, screen.getByLabelText('Max members'), '500');
      await waitForAutosave();

      const field = screen.getByLabelText('Max members');
      expect(field).toBeInvalid();
      expect(field).toHaveAccessibleDescription(expect.stringContaining('must be at most 200'));
      expect(field).toHaveValue(500);
      expect(screen.getByText('Could not save')).toBeInTheDocument();
    });

    it('uses a readable message when the server sends only the rule', async () => {
      const user = setupUser();
      saveWidgetDraft.mockRejectedValue(rejected([{ path: '/chat/maxMessageLength', rule: 'maximum' }]));
      renderEditor();
      await openSection(user, 'Chat');

      await replaceValue(user, screen.getByLabelText('Max message length'), '9000');
      await waitForAutosave();

      expect(screen.getByLabelText('Max message length')).toHaveAccessibleDescription(
        expect.stringContaining('This value is too large'),
      );
    });

    it('marks the section that has the problem, even when another one is open', async () => {
      const user = setupUser();
      saveWidgetDraft.mockRejectedValue(rejected([{ path: '/theme/colors/brand', rule: 'pattern' }]));
      renderEditor();
      await openSection(user, 'Chat');
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));
      await waitForAutosave();

      expect(screen.getByRole('button', { name: 'Style, 1 problem' })).toBeInTheDocument();
      await openSection(user, 'Style, 1 problem');
      expect(screen.getByLabelText('Brand')).toHaveAccessibleDescription(
        expect.stringContaining('This value has a format that is not allowed'),
      );
    });

    it('clears the message once the field is edited, and saves the fix', async () => {
      const user = setupUser();
      saveWidgetDraft
        .mockRejectedValueOnce(rejected([{ path: '/clan/maxMembers', rule: 'maximum', message: 'must be at most 200' }]))
        .mockResolvedValue(undefined);
      renderEditor();
      await openSection(user, 'Clan');
      await replaceValue(user, screen.getByLabelText('Max members'), '500');
      await waitForAutosave();

      await replaceValue(user, screen.getByLabelText('Max members'), '50');
      expect(screen.getByLabelText('Max members')).toBeValid();
      await waitForAutosave();

      expect(await screen.findByText('Saved')).toBeInTheDocument();
      expect(saveWidgetDraft.mock.calls.at(-1)[0].config.clan.maxMembers).toBe(50);
    });

    it('explains the tab rule next to the tab switches', async () => {
      const user = setupUser();
      saveWidgetDraft.mockRejectedValue(rejected([{ path: '', rule: 'anyOf' }]));
      renderEditor();
      await openSection(user, 'Layout');

      await user.click(screen.getByRole('switch', { name: 'Friends' }));
      await user.click(screen.getByRole('switch', { name: 'Clan' }));
      await user.click(screen.getByRole('switch', { name: 'Chat' }));
      await waitForAutosave();

      const tabs = screen.getByRole('region', { name: 'Tabs' });
      expect(within(tabs).getByRole('alert')).toHaveTextContent('Keep at least one tab on');
    });

    it('lists a problem that no field shows, with its path', async () => {
      const user = setupUser();
      saveWidgetDraft.mockRejectedValue(rejected([{ path: '/game_id', rule: 'pattern', message: 'not a game id' }]));
      renderEditor();
      await openSection(user, 'Chat');
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));
      await waitForAutosave();

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('/game_id');
      expect(alert).toHaveTextContent('not a game id');
    });
  });

  describe('advanced view', () => {
    it('shows the draft as read-only JSON with its size, and follows the edits', async () => {
      const user = setupUser();
      renderEditor();
      await openSection(user, 'Chat');
      await replaceValue(user, screen.getByLabelText('History shown'), '25');

      await openSection(user, 'Advanced');

      const raw = screen.getByLabelText('Draft config (read-only JSON)');
      expect(raw).toHaveAttribute('readonly');
      expect(JSON.parse(raw.value).chat.historyLimit).toBe(25);
      expect(screen.getByText(/KB of 64\.0 KB/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument();
    });
  });

  it('saves a pending edit when the person leaves the page', async () => {
    const user = setupUser();
    const router = renderEditor();
    await openSection(user, 'Chat');
    await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));

    await act(() => router.navigate('/'));
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
    expect(saveWidgetDraft.mock.calls[0][0].config.chat.profanityFilter).toBe(false);
  });
});
