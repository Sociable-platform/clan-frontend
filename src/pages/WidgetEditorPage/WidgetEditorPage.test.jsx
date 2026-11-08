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
const openTab = async (user, name) => user.click(await screen.findByRole('tab', { name }));
const rawConfig = () => JSON.parse(screen.getByLabelText('Draft config (read-only JSON)').value);
const radioIn = (group, name) => within(screen.getByRole('group', { name: group })).getByRole('radio', { name });

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

    it('shows the studio: the game, the save state, both panels and the config', async () => {
      renderEditor();

      expect(await screen.findByRole('heading', { name: 'Widget · Space Raiders' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to Space Raiders' })).toHaveAttribute('href', '/games/g1');
      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(screen.getByRole('tablist', { name: 'Widget settings' })).toBeInTheDocument();
      expect(screen.getByRole('tablist', { name: 'Style' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Live preview' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Experience config' })).toBeInTheDocument();
      expect(getWidgetDraft).toHaveBeenCalledWith(expect.objectContaining({ gameId: 'g1' }));
    });

    it('opens on Layout (settings) and Colors (style) with the draft values in the form', async () => {
      renderEditor();

      expect(await screen.findByRole('tab', { name: 'Layout' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: 'Colors' })).toHaveAttribute('aria-selected', 'true');
      expect(radioIn('Panel position', 'Bottom right')).toBeChecked();
      expect(screen.getByRole('switch', { name: 'Friends' })).toBeChecked();
      expect(radioIn('Color mode', 'Dark')).toBeChecked();
      expect(screen.getByLabelText('Brand')).toHaveValue('#80EAFF');
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
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });

  describe('editing', () => {
    it('updates the draft and saves it after the autosave delay', async () => {
      const user = setupUser();
      renderEditor();
      await openTab(user, 'Clan');

      await replaceValue(user, screen.getByLabelText('Max members'), '12');
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      expect(saveWidgetDraft).not.toHaveBeenCalled();
      await waitForAutosave();

      expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
      expect(saveWidgetDraft).toHaveBeenCalledWith({
        gameId: 'g1',
        config: buildWidgetConfig((config) => {
          config.clan.maxMembers = 12;
        }),
      });
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('shows the edit in the config panel at once', async () => {
      const user = setupUser();
      renderEditor();
      await openTab(user, 'Chat');

      await replaceValue(user, await screen.findByLabelText('History shown'), '25');

      expect(rawConfig().chat.historyLimit).toBe(25);
    });

    it('keeps an edit when moving between tabs', async () => {
      const user = setupUser();
      renderEditor();
      await openTab(user, 'Chat');
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));

      await openTab(user, 'Clan');
      await openTab(user, 'Chat');

      expect(screen.getByRole('switch', { name: 'Profanity filter' })).not.toBeChecked();
    });

    it('steps a number with the plus and minus buttons', async () => {
      const user = setupUser();
      renderEditor();
      await openTab(user, 'Clan');

      await user.click(screen.getByRole('button', { name: 'Increase Max members' }));
      await user.click(screen.getByRole('button', { name: 'Increase Max members' }));
      await user.click(screen.getByRole('button', { name: 'Decrease Max members' }));

      expect(rawConfig().clan.maxMembers).toBe(35);
    });

    it('turns badges on and off', async () => {
      const user = setupUser();
      renderEditor();
      await openTab(user, 'Clan');

      expect(screen.getByText('6 of 6 on')).toBeInTheDocument();
      await user.click(screen.getByRole('switch', { name: 'Moon' }));
      await user.click(screen.getByRole('switch', { name: 'Star' }));

      expect(rawConfig().clan.badges.allowed).toEqual(['diamond', 'peak', 'spark', 'cross']);
      expect(screen.getByText('4 of 6 on')).toBeInTheDocument();
    });

    it('turns clan screens and tabs on and off', async () => {
      const user = setupUser();
      renderEditor();
      await openTab(user, 'Clan');
      await user.click(screen.getByRole('switch', { name: 'Discover' }));
      await openTab(user, 'Layout');
      await user.click(screen.getByRole('switch', { name: 'Friends' }));
      await user.click(radioIn('Panel position', 'Bottom left'));

      const config = rawConfig();
      expect(config.clan.screens.discover.enabled).toBe(false);
      expect(config.friends.enabled).toBe(false);
      expect(config.layout.position).toBe('bottom-left');
    });

    describe('style', () => {
      it('swaps untouched colours when the mode changes and keeps picked ones', async () => {
        const user = setupUser();
        renderEditor();
        await replaceValue(user, await screen.findByLabelText('Surface'), '#334455');

        await user.click(radioIn('Color mode', 'Light'));

        const { theme } = rawConfig();
        expect(theme.mode).toBe('light');
        expect(theme.colors).toMatchObject({
          background: '#FFFFFF',
          surface: '#334455',
          text: '#000000',
          muted: '#5B5D56',
          brand: '#80EAFF',
        });
      });

      it('types a hex colour and picks a quick brand colour', async () => {
        const user = setupUser();
        renderEditor();

        await replaceValue(user, await screen.findByLabelText('Brand'), '#2e8b57');
        expect(rawConfig().theme.colors.brand).toBe('#2E8B57');
        await user.click(screen.getByRole('button', { name: 'Brand Red #E5484D' }));

        expect(rawConfig().theme.colors.brand).toBe('#E5484D');
        expect(screen.getByLabelText('Brand')).toHaveValue('#E5484D');
        expect(screen.getByRole('button', { name: 'Brand Red #E5484D' })).toHaveAttribute('aria-pressed', 'true');
      });

      it('shows contrast checks and resets the colours to the mode defaults', async () => {
        const user = setupUser();
        renderEditor();
        await replaceValue(user, await screen.findByLabelText('Text'), '#141D20');

        expect(screen.getByText('Text on background').parentElement).toHaveTextContent('low contrast');
        expect(screen.getByText('Button text on brand').parentElement).toHaveTextContent('passes');
        await user.click(screen.getByRole('button', { name: 'Reset to theme defaults' }));

        expect(rawConfig().theme.colors.text).toBe('#E8ECED');
        expect(screen.getByText('Text on background').parentElement).toHaveTextContent('passes');
      });

      it('picks heading and body fonts from the list, with search and categories', async () => {
        const user = setupUser();
        renderEditor();
        await openTab(user, 'Type');

        expect(screen.getByRole('button', { name: /Headings/ })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('43 fonts · picking for headings')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /^Orbitron/ }));
        await user.click(screen.getByRole('button', { name: /Body text/ }));
        await user.type(screen.getByRole('searchbox', { name: 'Search fonts' }), 'fred');
        expect(screen.getByText('1 fonts · picking for body text')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /^Fredoka/ }));

        const { fonts } = rawConfig().theme;
        expect(fonts.heading.family).toBe('Orbitron');
        expect(fonts.body.family).toBe('Fredoka');
      });

      it('filters the fonts by category', async () => {
        const user = setupUser();
        renderEditor();
        await openTab(user, 'Type');

        await user.click(screen.getByRole('button', { name: 'Pixel' }));

        expect(screen.getByText('4 fonts · picking for headings')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Inter/ })).not.toBeInTheDocument();
      });

      it('edits corners, frame, buttons, panel and chat layout', async () => {
        const user = setupUser();
        renderEditor();
        await openTab(user, 'Shape');

        await user.click(radioIn('Corners', 'Round'));
        await user.click(radioIn('Frame style', 'Double'));
        await replaceValue(user, screen.getByLabelText('Frame width'), '4');
        await user.click(radioIn('Button style', 'Outline'));
        await user.click(screen.getByRole('switch', { name: 'Uppercase labels' }));
        await user.click(screen.getByRole('button', { name: 'Decrease Opacity' }));
        await user.click(screen.getByRole('switch', { name: 'Blur the game behind' }));
        await user.click(radioIn('Chat layout', 'Log'));

        const config = rawConfig();
        expect(config.theme.frame).toMatchObject({ corners: 'round', style: 'double', width: 4 });
        expect(config.theme.buttons).toEqual({ style: 'outline', case: 'upper' });
        expect(config.theme.panel).toEqual({ opacity: 0.95, blur: true });
        expect(config.chat.layout).toBe('log');
      });

      it('sets and clears textures', async () => {
        const user = setupUser();
        renderEditor();
        await openTab(user, 'Textures');

        await user.click(radioIn('Panel frame', 'None'));
        await user.click(radioIn('Buttons', 'Carbon'));

        const { textures } = rawConfig().theme;
        expect(textures.panel).toBeUndefined();
        expect(textures.button).toEqual({ asset: 'tex_carbon', fit: 'tile', strength: 'subtle' });
      });
    });

    describe('texts', () => {
      it('shows the default text as a hint and stores only labels that were changed', async () => {
        const user = setupUser();
        renderEditor();
        await openTab(user, 'Texts');

        expect(screen.getByLabelText('Leave')).toHaveAttribute('placeholder', 'Leave clan');
        await replaceValue(user, screen.getByLabelText('Name (singular)'), 'Guild');
        expect(screen.getByLabelText('Leave')).toHaveAttribute('placeholder', 'Leave guild');
        await user.type(screen.getByLabelText('Send'), 'Fire');
        await user.clear(screen.getByLabelText('Panel title'));

        const { texts } = rawConfig();
        expect(texts.terms.clan).toBe('Guild');
        expect(texts.labels).toEqual({ createCta: '+ Start a {clan}', send: 'Fire' });
      });

      it('says whether a text is custom or the default', async () => {
        const user = setupUser();
        renderEditor();
        await openTab(user, 'Texts');

        const labelRow = (label) => screen.getByLabelText(label).parentElement.querySelector('.field-aside');
        expect(labelRow('Panel title')).toHaveTextContent('Custom');
        expect(labelRow('Send')).toHaveTextContent('Default');
      });

      it('resets the texts to the defaults', async () => {
        const user = setupUser();
        renderEditor();
        await openTab(user, 'Texts');

        await user.click(screen.getByRole('button', { name: 'Reset texts to defaults' }));

        expect(rawConfig().texts).toEqual({ terms: { clan: 'Clan', clans: 'Clans' }, labels: {} });
      });
    });
  });

  describe('save status', () => {
    it('shows saving while the request is in flight', async () => {
      const user = setupUser();
      let finish;
      saveWidgetDraft.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      renderEditor();
      await openTab(user, 'Chat');
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));

      await waitForAutosave();
      expect(screen.getByText('Saving…')).toBeInTheDocument();

      await act(async () => finish());
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('shows an error with the reason and a retry that saves again', async () => {
      const user = setupUser();
      saveWidgetDraft
        .mockRejectedValueOnce(new ApiError({ status: 0, code: 'network_error', message: 'Cannot reach the server.' }))
        .mockResolvedValue(undefined);
      renderEditor();
      await openTab(user, 'Chat');
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
      await openTab(user, 'Clan');

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
      await openTab(user, 'Chat');

      await replaceValue(user, screen.getByLabelText('Max message length'), '9000');
      await waitForAutosave();

      expect(screen.getByLabelText('Max message length')).toHaveAccessibleDescription(
        expect.stringContaining('This value is too large'),
      );
    });

    it('marks the tab that has the problem, even when another one is open', async () => {
      const user = setupUser();
      saveWidgetDraft.mockRejectedValue(rejected([{ path: '/theme/colors/brand', rule: 'pattern' }]));
      renderEditor();
      await openTab(user, 'Type');
      await user.click(screen.getByRole('button', { name: /^Orbitron/ }));
      await waitForAutosave();

      expect(screen.getByRole('tab', { name: 'Colors, 1 problem' })).toBeInTheDocument();
      expect(screen.getByText('1 problem')).toBeInTheDocument();
      await openTab(user, 'Colors, 1 problem');
      expect(screen.getByLabelText('Brand')).toHaveAccessibleDescription(
        expect.stringContaining('This value has a format that is not allowed'),
      );
    });

    it('shows a chat layout problem under Shape, where the control is', async () => {
      const user = setupUser();
      saveWidgetDraft.mockRejectedValue(rejected([{ path: '/chat/layout', rule: 'enum' }]));
      renderEditor();
      await openTab(user, 'Chat');
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));
      await waitForAutosave();

      expect(screen.getByRole('tab', { name: 'Shape, 1 problem' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Chat' })).toBeInTheDocument();
    });

    it('clears the message once the field is edited, and saves the fix', async () => {
      const user = setupUser();
      saveWidgetDraft
        .mockRejectedValueOnce(rejected([{ path: '/clan/maxMembers', rule: 'maximum', message: 'must be at most 200' }]))
        .mockResolvedValue(undefined);
      renderEditor();
      await openTab(user, 'Clan');
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

      await user.click(await screen.findByRole('switch', { name: 'Friends' }));
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
      await openTab(user, 'Chat');
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));
      await waitForAutosave();

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('/game_id');
      expect(alert).toHaveTextContent('not a game id');
    });
  });

  describe('config panel (raw JSON)', () => {
    it('shows the draft as read-only JSON with its version and size', async () => {
      renderEditor();

      const raw = await screen.findByLabelText('Draft config (read-only JSON)');
      expect(raw).toHaveAttribute('readonly');
      expect(JSON.parse(raw.value).game_id).toBe(buildWidgetConfig().game_id);
      expect(screen.getByText('schemaVersion 1')).toBeInTheDocument();
      expect(screen.getByText(/KB of 64\.0 KB/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument();
    });

    it('hides and shows the config', async () => {
      const user = setupUser();
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Hide config' }));
      expect(screen.queryByLabelText('Draft config (read-only JSON)')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Show config' }));

      expect(screen.getByLabelText('Draft config (read-only JSON)')).toBeInTheDocument();
    });

    it('counts the server problems', async () => {
      const user = setupUser();
      saveWidgetDraft.mockRejectedValue(
        rejected([
          { path: '/clan/maxMembers', rule: 'maximum' },
          { path: '/chat/historyLimit', rule: 'maximum' },
        ]),
      );
      renderEditor();
      await openTab(user, 'Chat');
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));
      await waitForAutosave();

      expect(screen.getByText('2 problems')).toBeInTheDocument();
    });
  });

  it('saves a pending edit when the person leaves the page', async () => {
    const user = setupUser();
    const router = renderEditor();
    await openTab(user, 'Chat');
    await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));

    await act(() => router.navigate('/'));
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
    expect(saveWidgetDraft.mock.calls[0][0].config.chat.profanityFilter).toBe(false);
  });
});
