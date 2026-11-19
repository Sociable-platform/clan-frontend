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
import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/store';
import {
  buildDeveloper,
  buildGame,
  buildSuspendedDeveloper,
  buildWidgetConfig,
  buildWidgetVersion,
} from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { WidgetEditorPage } from './WidgetEditorPage';

vi.mock('@/features/widget/api/widgetApi');
vi.mock('@/features/games/api/gamesApi');

const GAME = buildGame({ id: 'g1', name: 'Space Raiders' });
const SERVED = [buildWidgetVersion({ version: 2 }), buildWidgetVersion({ version: 1 })];

function signIn(developer) {
  useAuthStore.getState().startSession({ token: 't', expiresAt: Date.now() + 60_000, developer });
}

function renderEditor() {
  return renderWithRouter([{ path: '/games/:gameId/widget', element: <WidgetEditorPage /> }], {
    initialEntries: ['/games/g1/widget'],
  });
}

const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('WidgetEditorPage for a suspended developer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.resetAllMocks();
    listGames.mockResolvedValue([GAME]);
    getWidgetDraft.mockResolvedValue(buildWidgetConfig());
    saveWidgetDraft.mockResolvedValue(undefined);
    listWidgetVersions.mockResolvedValue(SERVED.map(({ config: _config, ...summary }) => summary));
    getWidgetVersion.mockImplementation(async ({ version }) => SERVED.find((candidate) => candidate.version === version));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('turns Publish off and explains why', async () => {
    signIn(buildSuspendedDeveloper());
    renderEditor();

    const publish = await screen.findByRole('button', { name: 'Publish v3' });

    expect(publish).toBeDisabled();
    expect(publish).toHaveAccessibleDescription(/suspended, so changes are turned off/i);
  });

  it('turns off every control in the settings and style panels', async () => {
    signIn(buildSuspendedDeveloper());
    renderEditor();
    await screen.findByRole('button', { name: 'Publish v3' });

    const panels = screen.getAllByRole('tabpanel');
    const controls = panels.flatMap((panel) => within(panel).queryAllByRole('textbox')).concat(
      panels.flatMap((panel) => within(panel).queryAllByRole('button')),
    );

    expect(controls.length).toBeGreaterThan(0);
    controls.forEach((control) => expect(control).toBeDisabled());
  });

  it('still lets the developer switch tabs and preview a published version', async () => {
    const user = setupUser();
    signIn(buildSuspendedDeveloper());
    renderEditor();

    await user.click(await screen.findByRole('tab', { name: 'Clan' }));
    await user.click(await screen.findByRole('button', { name: 'Preview version 1' }));

    expect(screen.getByRole('tab', { name: 'Clan', selected: true })).toBeEnabled();
    expect(await screen.findByRole('heading', { name: 'Version 1' })).toBeInTheDocument();
  });

  it('turns Roll back off in the history and in a version preview', async () => {
    const user = setupUser();
    signIn(buildSuspendedDeveloper());
    renderEditor();

    const rollBackInList = await screen.findByRole('button', { name: 'Roll back to version 1' });
    expect(rollBackInList).toBeDisabled();
    expect(rollBackInList).toHaveAccessibleDescription(/suspended/i);
    await user.click(screen.getByRole('button', { name: 'Preview version 1' }));
    expect(await screen.findByRole('button', { name: 'Roll back to v1' })).toBeDisabled();
    expect(rollbackWidget).not.toHaveBeenCalled();
  });

  it('shows the usual editor to an active developer: nothing is turned off', async () => {
    signIn(buildDeveloper());
    renderEditor();

    expect(await screen.findByRole('button', { name: 'Publish v3' })).toBeEnabled();
    expect(await screen.findByRole('button', { name: 'Roll back to version 1' })).toBeEnabled();
    const panel = screen.getAllByRole('tabpanel')[0];
    within(panel).queryAllByRole('textbox').forEach((field) => expect(field).toBeEnabled());
    expect(document.querySelector('.read-only-scope')).toBeNull();
  });

  it('says nothing was published when the server refuses a publish because of a suspension', async () => {
    const user = setupUser();
    signIn(buildDeveloper());
    publishWidget.mockRejectedValue(
      new ApiError({ status: 403, code: 'account_suspended', message: 'Your account is suspended.' }),
    );
    renderEditor();

    await user.click(await screen.findByRole('button', { name: 'Publish v3' }));
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your account is suspended, so nothing was published.');
  });

  it('shows no alerts or Retry of its own when a suspension stops the save a publish starts', async () => {
    const user = setupUser();
    signIn(buildDeveloper());
    // What the HTTP client does on a 403 account_suspended: go read-only, then refuse the request.
    saveWidgetDraft.mockImplementation(async () => {
      useAuthStore.getState().markDeveloperSuspended();
      throw new ApiError({ status: 403, code: 'account_suspended', message: 'Your account is suspended.' });
    });
    renderEditor();

    await user.click(await screen.findByRole('button', { name: 'Publish v3' }));
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(await screen.findByRole('button', { name: 'Publish v3' })).toBeDisabled();
    expect(publishWidget).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/Fix what is marked/)).not.toBeInTheDocument();
    expect(screen.getByText('Could not save')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('clears what the suspension left behind when the account is resumed', async () => {
    const user = setupUser();
    signIn(buildDeveloper());
    saveWidgetDraft.mockImplementationOnce(async () => {
      useAuthStore.getState().markDeveloperSuspended();
      throw new ApiError({ status: 403, code: 'account_suspended', message: 'Your account is suspended.' });
    });
    renderEditor();
    await user.click(await screen.findByRole('button', { name: 'Publish v3' }));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(await screen.findByText('Could not save')).toBeInTheDocument();

    // "Check again" fetches the profile: the account is active again.
    act(() => useAuthStore.getState().setDeveloper(buildDeveloper()));

    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/Fix what is marked/)).not.toBeInTheDocument();
    expect(screen.queryByText(/draft was not saved/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish v3' })).toBeEnabled();
  });
});
