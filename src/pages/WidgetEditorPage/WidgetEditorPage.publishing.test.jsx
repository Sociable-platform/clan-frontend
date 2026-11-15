import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listGames } from '@/features/games/api/gamesApi';
import {
  getWidgetDraft,
  getWidgetVersion,
  listWidgetVersions,
  publishWidget,
  rollbackWidget,
  saveWidgetDraft,
} from '@/features/widget/api/widgetApi';
import { WIDGET_AUTOSAVE_DELAY_MS } from '@/features/widget/config/widgetConfig';
import { ApiError } from '@/shared/api';
import { buildGame, buildWidgetConfig, buildWidgetVersion, buildWidgetVersionSummary } from '@/test/builders';
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
const apiError = (status, code, message = 'x', details = []) => new ApiError({ status, code, message, details });

// Serves the history and each version's config from `versions` (full versions, newest first, as the
// API module returns them: sorting is the mapper's job, tested in widgetVersionMapper.test.js).
function serveVersions(versions) {
  listWidgetVersions.mockResolvedValue(versions.map(({ config: _config, ...summary }) => summary));
  getWidgetVersion.mockImplementation(async ({ version }) => versions.find((candidate) => candidate.version === version));
}

const historyRows = () => within(screen.getByRole('list', { name: 'Published versions' })).getAllByRole('listitem');

describe('WidgetEditorPage publishing and history', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.resetAllMocks();
    listGames.mockResolvedValue([GAME]);
    getWidgetDraft.mockResolvedValue(buildWidgetConfig());
    saveWidgetDraft.mockResolvedValue(undefined);
    serveVersions([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('before the first publish', () => {
    it('says nothing is published, offers version 1 and explains the empty history', async () => {
      renderEditor();

      expect(await screen.findByText('Not published yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Publish v1' })).toBeEnabled();
      expect(await screen.findByText('Nothing published yet')).toBeInTheDocument();
    });
  });

  describe('publishing', () => {
    it('saves the draft, publishes it and shows the new version number', async () => {
      const user = setupUser();
      const config = buildWidgetConfig();
      publishWidget.mockResolvedValue(buildWidgetVersion({ version: 1, config }));
      renderEditor();
      await screen.findByRole('button', { name: 'Publish v1' });
      serveVersions([buildWidgetVersion({ version: 1, config })]);

      await user.click(screen.getByRole('button', { name: 'Publish v1' }));

      expect(await screen.findByText(/Published version 1\./)).toBeInTheDocument();
      expect(publishWidget).toHaveBeenCalledWith({ gameId: 'g1' });
      expect(saveWidgetDraft.mock.invocationCallOrder[0]).toBeLessThan(publishWidget.mock.invocationCallOrder[0]);
      expect(await screen.findByText('Published · v1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Publish v2' })).toBeInTheDocument();
    });

    it('saves a draft edit that is still waiting for autosave before it publishes', async () => {
      const user = setupUser();
      publishWidget.mockResolvedValue(buildWidgetVersion({ version: 1 }));
      renderEditor();
      await user.click(await screen.findByRole('tab', { name: 'Chat' }));
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Publish v1' }));
      await screen.findByText(/Published version 1\./);

      expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
      expect(saveWidgetDraft.mock.calls[0][0].config.chat.profanityFilter).toBe(false);
      expect(saveWidgetDraft.mock.invocationCallOrder[0]).toBeLessThan(publishWidget.mock.invocationCallOrder[0]);
      await act(() => vi.advanceTimersByTimeAsync(WIDGET_AUTOSAVE_DELAY_MS));
      expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
    });

    it('disables the button while publishing', async () => {
      const user = setupUser();
      let finish;
      publishWidget.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Publish v1' }));

      expect(await screen.findByRole('button', { name: 'Publishing…' })).toBeDisabled();
      await act(async () => finish(buildWidgetVersion({ version: 1 })));
      expect(await screen.findByRole('button', { name: 'Publish v1' })).toBeEnabled();
    });

    it('does not publish, and says why, when the draft cannot be saved', async () => {
      const user = setupUser();
      saveWidgetDraft.mockRejectedValue(
        apiError(400, 'invalid_widget_config', 'Invalid', [{ path: '/clan/maxMembers', rule: 'maximum', message: 'must be at most 200' }]),
      );
      renderEditor();
      await user.click(await screen.findByRole('tab', { name: 'Clan' }));
      await user.clear(screen.getByLabelText('Max members'));
      await user.type(screen.getByLabelText('Max members'), '500');

      await user.click(screen.getByRole('button', { name: 'Publish v1' }));

      expect(await screen.findByText(/Nothing was published, because the draft could not be saved/)).toBeInTheDocument();
      expect(publishWidget).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Max members')).toHaveAccessibleDescription(expect.stringContaining('must be at most 200'));
      expect(screen.getByRole('button', { name: 'Publish v1' })).toBeEnabled();
    });

    it('explains a draft the server no longer accepts, with the server message and the problems', async () => {
      const user = setupUser();
      publishWidget.mockRejectedValue(
        apiError(400, 'invalid_widget_config', 'Config must be a JSON object', [
          { path: '/theme/colors/brand', rule: 'pattern', message: 'bad color' },
        ]),
      );
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Publish v1' }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Nothing was published');
      expect(alert).toHaveTextContent('Config must be a JSON object');
      expect(alert).toHaveTextContent('/theme/colors/brand');
      expect(alert).toHaveTextContent('bad color');
      expect(screen.queryByText('Published · v1')).not.toBeInTheDocument();
    });

    it('explains that there is no saved draft', async () => {
      const user = setupUser();
      publishWidget.mockRejectedValue(apiError(409, 'widget_draft_missing', 'Save a draft before publishing'));
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Publish v1' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('there is no saved draft yet');
    });

    it('explains a network failure and lets the person dismiss the message', async () => {
      const user = setupUser();
      publishWidget.mockRejectedValue(apiError(0, 'network_error', 'Cannot reach the server.'));
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Publish v1' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.');
      await user.click(screen.getByRole('button', { name: 'Dismiss' }));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('clears the earlier message when publishing again', async () => {
      const user = setupUser();
      publishWidget.mockRejectedValueOnce(apiError(500, 'internal')).mockResolvedValue(buildWidgetVersion({ version: 1 }));
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Publish v1' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Could not publish');
      await user.click(screen.getByRole('button', { name: 'Publish v1' }));

      expect(await screen.findByText(/Published version 1\./)).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('published status', () => {
    it('says the draft is the live version when they hold the same config, whatever the key order', async () => {
      const reordered = Object.fromEntries(Object.entries(buildWidgetConfig()).reverse());
      serveVersions([buildWidgetVersion({ version: 3, config: reordered })]);

      renderEditor();

      expect(await screen.findByText('Published · v3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Publish v4' })).toBeInTheDocument();
    });

    it('says the draft has unpublished changes when it differs from the live version', async () => {
      serveVersions([
        buildWidgetVersion({
          version: 2,
          config: buildWidgetConfig((config) => {
            config.clan.maxMembers = 10;
          }),
        }),
      ]);

      renderEditor();

      expect(await screen.findByText('Draft · unpublished changes')).toBeInTheDocument();
    });

    it('notices an edit made after publishing', async () => {
      const user = setupUser();
      serveVersions([buildWidgetVersion({ version: 1 })]);
      renderEditor();
      expect(await screen.findByText('Published · v1')).toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: 'Chat' }));
      await user.click(screen.getByRole('switch', { name: 'Profanity filter' }));

      expect(screen.getByText('Draft · unpublished changes')).toBeInTheDocument();
    });
  });

  describe('version history', () => {
    const VERSIONS = [buildWidgetVersion({ version: 3 }), buildWidgetVersion({ version: 2 }), buildWidgetVersion({ version: 1 })];

    it('lists the versions newest first, with their dates, and marks the live one', async () => {
      serveVersions(VERSIONS);
      renderEditor();

      await screen.findByRole('list', { name: 'Published versions' });
      const rows = historyRows();

      expect(rows.map((row) => row.querySelector('.version-number').textContent)).toEqual(['v3', 'v2', 'v1']);
      expect(rows[0]).toHaveTextContent('Live');
      expect(rows[1]).not.toHaveTextContent('Live');
      expect(rows[0].querySelector('.version-date').textContent).toMatch(/Nov 3, 2026/);
      expect(screen.getByText('3 versions')).toBeInTheDocument();
    });

    it('offers Preview on every version and Roll back on every one but the live one', async () => {
      serveVersions(VERSIONS);
      renderEditor();
      await screen.findByRole('list', { name: 'Published versions' });

      expect(screen.getByRole('button', { name: 'Preview version 3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Preview version 1' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Roll back to version 3' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Roll back to version 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Roll back to version 1' })).toBeInTheDocument();
    });

    it('shows an error with a retry when the history cannot be loaded', async () => {
      const user = setupUser();
      listWidgetVersions.mockRejectedValueOnce(apiError(500, 'internal')).mockResolvedValue([buildWidgetVersionSummary({ version: 1 })]);
      renderEditor();

      expect(await screen.findByText('Could not load the version history')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByRole('list', { name: 'Published versions' })).toBeInTheDocument();
    });

    it('hides and shows the history', async () => {
      const user = setupUser();
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Hide history' }));
      expect(screen.queryByRole('heading', { name: 'Version history' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Show history' }));

      expect(screen.getByRole('heading', { name: 'Version history' })).toBeInTheDocument();
    });

    it('goes to the history when it is shown, and stays put when it is hidden', async () => {
      const user = setupUser();
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Hide history' }));
      expect(scrollIntoView).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: 'Show history' }));

      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView.mock.instances[0]).toContainElement(screen.getByRole('heading', { name: 'Version history' }));
      scrollIntoView.mockRestore();
    });
  });

  describe('previewing an old version', () => {
    const OLD = buildWidgetVersion({
      version: 1,
      config: buildWidgetConfig((config) => {
        config.clan.maxMembers = 10;
      }),
    });

    beforeEach(() => serveVersions([buildWidgetVersion({ version: 2 }), OLD]));

    it('shows that version as read-only JSON, in place of the draft config', async () => {
      const user = setupUser();
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Preview version 1' }));

      expect(await screen.findByRole('heading', { name: 'Version 1' })).toBeInTheDocument();
      const raw = screen.getByLabelText('Draft config (read-only JSON)');
      expect(raw).toHaveAttribute('readonly');
      expect(JSON.parse(raw.value).config.clan.maxMembers).toBe(10);
      expect(screen.getByText(/Published Nov 1, 2026.*read-only/)).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Experience config' })).not.toBeInTheDocument();
      expect(screen.getByText('Previewing')).toBeInTheDocument();
    });

    it('goes back to the draft', async () => {
      const user = setupUser();
      renderEditor();
      await user.click(await screen.findByRole('button', { name: 'Preview version 1' }));

      await user.click(await screen.findByRole('button', { name: 'Back to draft' }));

      expect(screen.getByRole('heading', { name: 'Experience config' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Version 1' })).not.toBeInTheDocument();
    });

    it('still shows the preview when the draft config is hidden', async () => {
      const user = setupUser();
      renderEditor();
      await user.click(await screen.findByRole('button', { name: 'Hide config' }));

      await user.click(await screen.findByRole('button', { name: 'Preview version 1' }));

      expect(await screen.findByRole('heading', { name: 'Version 1' })).toBeInTheDocument();
    });

    it('has no Roll back for the live version', async () => {
      const user = setupUser();
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Preview version 2' }));

      await screen.findByRole('heading', { name: 'Version 2' });
      expect(screen.queryByRole('button', { name: 'Roll back to v2' })).not.toBeInTheDocument();
    });

    it('says when the version cannot be loaded, and offers a retry or the way back', async () => {
      const user = setupUser();
      getWidgetVersion.mockImplementation(async ({ version }) => {
        if (version === 1) throw apiError(500, 'internal');
        return buildWidgetVersion({ version });
      });
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Preview version 1' }));

      expect(await screen.findByText(/Could not load this version \(version 1\)/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Back to draft' }));
      expect(screen.getByRole('heading', { name: 'Experience config' })).toBeInTheDocument();
    });
  });

  describe('rolling back', () => {
    const SERVED = [buildWidgetVersion({ version: 3 }), buildWidgetVersion({ version: 2 }), buildWidgetVersion({ version: 1 })];

    beforeEach(() => serveVersions(SERVED));

    it('asks first, and does nothing when cancelled', async () => {
      const user = setupUser();
      renderEditor();

      await user.click(await screen.findByRole('button', { name: 'Roll back to version 2' }));
      const dialog = await screen.findByRole('alertdialog', { name: 'Roll back to version 2?' });
      expect(dialog).toHaveTextContent('published again as version 4');
      expect(dialog).toHaveTextContent('Nothing is deleted');
      expect(dialog).toHaveTextContent('your draft is not changed');
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(rollbackWidget).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('rolls back after the confirmation and shows the result as the newest version', async () => {
      const user = setupUser();
      rollbackWidget.mockResolvedValue(buildWidgetVersion({ version: 4 }));
      renderEditor();
      await user.click(await screen.findByRole('button', { name: 'Roll back to version 2' }));
      serveVersions([buildWidgetVersion({ version: 4 }), ...SERVED]);

      await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Roll back' }));

      expect(rollbackWidget).toHaveBeenCalledWith({ gameId: 'g1', version: 2 });
      expect(await screen.findByText(/Rolled back: version 2 is live again, as version 4\./)).toBeInTheDocument();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      await act(() => vi.advanceTimersByTimeAsync(0));
      const rows = historyRows();
      expect(rows.map((row) => row.querySelector('.version-number').textContent)).toEqual(['v4', 'v3', 'v2', 'v1']);
      expect(rows[0]).toHaveTextContent('Live');
      expect(screen.getByRole('button', { name: 'Publish v5' })).toBeInTheDocument();
    });

    it('leaves the draft alone', async () => {
      const user = setupUser();
      rollbackWidget.mockResolvedValue(buildWidgetVersion({ version: 4 }));
      renderEditor();
      await user.click(await screen.findByRole('button', { name: 'Roll back to version 1' }));

      await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Roll back' }));
      await screen.findByText(/Rolled back/);

      expect(saveWidgetDraft).not.toHaveBeenCalled();
    });

    it('keeps the dialog open with the reason when it fails', async () => {
      const user = setupUser();
      rollbackWidget.mockRejectedValue(apiError(404, 'widget_version_not_found'));
      renderEditor();
      await user.click(await screen.findByRole('button', { name: 'Roll back to version 2' }));

      await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Roll back' }));

      expect(await within(screen.getByRole('alertdialog')).findByRole('alert')).toHaveTextContent('That version no longer exists.');
    });

    it('can be started from the preview of an old version, and closes the preview when done', async () => {
      const user = setupUser();
      rollbackWidget.mockResolvedValue(buildWidgetVersion({ version: 4 }));
      renderEditor();
      await user.click(await screen.findByRole('button', { name: 'Preview version 1' }));

      await user.click(await screen.findByRole('button', { name: 'Roll back to v1' }));
      expect(await screen.findByRole('alertdialog', { name: 'Roll back to version 1?' })).toBeInTheDocument();
      await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Roll back' }));

      await screen.findByText(/Rolled back: version 1 is live again, as version 4\./);
      expect(screen.queryByRole('heading', { name: 'Version 1' })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Experience config' })).toBeInTheDocument();
    });
  });
});
