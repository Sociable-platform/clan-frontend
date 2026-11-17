import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAdminDeveloper,
  listAdminAuditLog,
  setAdminDeveloperStatus,
  setAdminGameStatus,
} from '@/features/admin/api/adminApi';
import { ApiError } from '@/shared/api';
import { clearToasts } from '@/shared/notifications';
import { Toaster } from '@/shared/ui/Toaster';
import {
  buildAdminDeveloperDetail,
  buildAdminGame,
  buildAuditEntry,
  buildAuditPage,
} from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';
import { chooseOption } from '@/test/selectField';

import { AdminDeveloperDetailPage } from './AdminDeveloperDetailPage';

vi.mock('@/features/admin/api/adminApi');

const DEVELOPER_ID = 'd1';

function renderPage({ withToaster = false } = {}) {
  return renderWithRouter(
    [
      { path: '/admin/developers', element: <p>Developers list</p> },
      {
        path: '/admin/developers/:developerId',
        element: (
          <>
            <AdminDeveloperDetailPage />
            {withToaster ? <Toaster /> : null}
          </>
        ),
      },
    ],
    { initialEntries: [`/admin/developers/${DEVELOPER_ID}`] },
  );
}

const SUSPENDED_DEVELOPER = buildAdminDeveloperDetail({
  id: DEVELOPER_ID,
  status: 'suspended',
  isSuspended: true,
  statusReason: 'non_payment',
  statusChangedAt: '2026-11-12T12:00:00Z',
  games: [
    buildAdminGame({ id: 'g1', name: 'Farm Friends', description: 'Cozy farming game' }),
    buildAdminGame({
      id: 'g2',
      name: 'Space Raiders',
      description: '',
      status: 'suspended',
      isSuspended: true,
      statusReason: 'abuse',
    }),
  ],
});

describe('AdminDeveloperDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearToasts();
    listAdminAuditLog.mockResolvedValue(buildAuditPage([]));
  });

  it('announces loading and shows skeletons shaped like the page while it loads', () => {
    getAdminDeveloper.mockReturnValue(new Promise(() => {}));
    listAdminAuditLog.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading developer');
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('asks for the developer and for the audit entries about that developer', async () => {
    getAdminDeveloper.mockResolvedValue(SUSPENDED_DEVELOPER);

    renderPage();

    await screen.findByRole('heading', { level: 1 });
    expect(getAdminDeveloper).toHaveBeenCalledWith(
      expect.objectContaining({ developerId: DEVELOPER_ID }),
    );
    expect(listAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: DEVELOPER_ID, cursor: null }),
    );
  });

  it("shows the developer's name, email, status and the reason for a suspension", async () => {
    getAdminDeveloper.mockResolvedValue(SUSPENDED_DEVELOPER);

    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Dev One' })).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Dev One' });
    expect(within(summary).getByText('Suspended')).toBeInTheDocument();
    expect(within(summary).getByText('dev@example.com')).toBeInTheDocument();
    expect(within(summary).getByText('Non-payment')).toBeInTheDocument();
    expect(within(summary).getByText(/Nov 12, 2026/)).toBeInTheDocument();
  });

  it('shows no reason for an active developer', async () => {
    getAdminDeveloper.mockResolvedValue(buildAdminDeveloperDetail({ id: DEVELOPER_ID }));

    renderPage();

    const summary = await screen.findByRole('region', { name: 'Dev One' });
    expect(within(summary).getByText('Active')).toBeInTheDocument();
    expect(within(summary).queryByText('Reason')).not.toBeInTheDocument();
  });

  it('uses the email as the heading when the developer has no name', async () => {
    getAdminDeveloper.mockResolvedValue(buildAdminDeveloperDetail({ name: '' }));

    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'dev@example.com' })).toBeInTheDocument();
  });

  it('lists each game with its own status and reason', async () => {
    getAdminDeveloper.mockResolvedValue(SUSPENDED_DEVELOPER);

    renderPage();

    const table = await screen.findByRole('table', { name: /games owned/i });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2 games
    expect(within(rows[1]).getByText('Farm Friends')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Cozy farming game')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Active')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Space Raiders')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Suspended')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Abuse')).toBeInTheDocument();
  });

  it('says so when the developer has no games', async () => {
    getAdminDeveloper.mockResolvedValue(buildAdminDeveloperDetail({ games: [] }));

    renderPage();

    expect(await screen.findByText('No games')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('lists the audit history with actor, action, reason, note and time, in the order sent', async () => {
    getAdminDeveloper.mockResolvedValue(SUSPENDED_DEVELOPER);
    listAdminAuditLog.mockResolvedValue(
      buildAuditPage([
        buildAuditEntry({
          id: 'e2',
          action: 'developer.resumed',
          reason: 'non_payment',
          note: 'Paid in full',
          createdAt: '2026-11-13T09:00:00Z',
        }),
        buildAuditEntry({ id: 'e1', actorId: 'system:billing', isSystemActor: true, note: '' }),
      ]),
    );

    renderPage();

    const items = within(await screen.findByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Developer resumed')).toBeInTheDocument();
    expect(within(items[0]).getByText(/Admin 0b7f6c52/)).toBeInTheDocument();
    expect(within(items[0]).getByText(/Non-payment/)).toBeInTheDocument();
    expect(within(items[0]).getByText('Paid in full')).toBeInTheDocument();
    expect(within(items[0]).getByText(/Nov 13, 2026/)).toBeInTheDocument();
    expect(within(items[1]).getByText('Developer suspended')).toBeInTheDocument();
    expect(within(items[1]).getByText('System')).toBeInTheDocument();
  });

  it('says so when the status was never changed', async () => {
    getAdminDeveloper.mockResolvedValue(buildAdminDeveloperDetail({ id: DEVELOPER_ID }));

    renderPage();

    expect(await screen.findByText('No changes yet')).toBeInTheDocument();
  });

  it('shows a skeleton for the history while the developer is already on screen', async () => {
    getAdminDeveloper.mockResolvedValue(SUSPENDED_DEVELOPER);
    listAdminAuditLog.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Dev One' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading status history');
  });

  it('loads the next page of history on request and appends it', async () => {
    const user = userEvent.setup();
    getAdminDeveloper.mockResolvedValue(SUSPENDED_DEVELOPER);
    listAdminAuditLog
      .mockResolvedValueOnce(buildAuditPage([buildAuditEntry({ id: 'e2', note: 'Newer' })], 'c1'))
      .mockResolvedValueOnce(buildAuditPage([buildAuditEntry({ id: 'e1', note: 'Older' })], null));

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Older')).toBeInTheDocument();
    expect(screen.getByText('Newer')).toBeInTheDocument();
    expect(listAdminAuditLog).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'c1' }));
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('keeps the entries shown and says so when the next page fails', async () => {
    const user = userEvent.setup();
    getAdminDeveloper.mockResolvedValue(SUSPENDED_DEVELOPER);
    listAdminAuditLog
      .mockResolvedValueOnce(buildAuditPage([buildAuditEntry({ note: 'Kept' })], 'c1'))
      .mockRejectedValueOnce(new ApiError({ status: 500, code: 'internal_error', message: 'boom' }));

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load more history.');
    expect(screen.getByText('Kept')).toBeInTheDocument();
  });

  it('shows an error with a retry for the history without hiding the developer', async () => {
    const user = userEvent.setup();
    getAdminDeveloper.mockResolvedValue(SUSPENDED_DEVELOPER);
    listAdminAuditLog
      .mockRejectedValueOnce(new ApiError({ status: 500, code: 'internal_error', message: 'boom' }))
      .mockResolvedValueOnce(buildAuditPage([buildAuditEntry({ note: 'Back again' })]));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the status history');
    expect(screen.getByRole('heading', { level: 1, name: 'Dev One' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Back again')).toBeInTheDocument();
  });

  it('shows a not-found state with a way back for an unknown developer', async () => {
    getAdminDeveloper.mockRejectedValue(
      new ApiError({ status: 404, code: 'developer_not_found', message: 'Developer not found' }),
    );

    renderPage();

    expect(await screen.findByText('Developer not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to developers' })).toHaveAttribute(
      'href',
      '/admin/developers',
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('shows a retryable error, not "not found", when the request fails for another reason', async () => {
    const user = userEvent.setup();
    getAdminDeveloper
      .mockRejectedValueOnce(new ApiError({ status: 500, code: 'internal_error', message: 'boom' }))
      .mockResolvedValueOnce(SUSPENDED_DEVELOPER);

    renderPage();

    expect(await screen.findByText('Could not load this developer')).toBeInTheDocument();
    expect(screen.queryByText('Developer not found')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Dev One' })).toBeInTheDocument();
  });

  it('links back to the developers list', async () => {
    getAdminDeveloper.mockResolvedValue(SUSPENDED_DEVELOPER);

    renderPage();

    expect(await screen.findByRole('link', { name: 'Developers' })).toHaveAttribute('href', '/admin/developers');
  });

  describe('suspending and resuming', () => {
    const ACTIVE_DEVELOPER = buildAdminDeveloperDetail({
      id: DEVELOPER_ID,
      games: [buildAdminGame({ id: 'g1', name: 'Farm Friends' })],
    });

    it('asks for a reason before a developer can be suspended', async () => {
      const user = userEvent.setup();
      getAdminDeveloper.mockResolvedValue(ACTIVE_DEVELOPER);
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Suspend dev@example.com' }));

      const dialog = await screen.findByRole('alertdialog', { name: 'Suspend this developer?' });
      expect(within(dialog).getByText('dev@example.com')).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Suspend developer' })).toBeDisabled();
      await chooseOption(user, within(dialog).getByLabelText('Reason'), 'Abuse');
      expect(within(dialog).getByRole('button', { name: 'Suspend developer' })).toBeEnabled();
      expect(setAdminDeveloperStatus).not.toHaveBeenCalled();
    });

    it('suspends the developer with the reason and note, then refreshes the page and shows a toast', async () => {
      const user = userEvent.setup();
      getAdminDeveloper
        .mockResolvedValueOnce(ACTIVE_DEVELOPER)
        .mockResolvedValue({ ...SUSPENDED_DEVELOPER, games: ACTIVE_DEVELOPER.games });
      listAdminAuditLog
        .mockResolvedValueOnce(buildAuditPage([]))
        .mockResolvedValue(buildAuditPage([buildAuditEntry({ reason: 'abuse', note: 'Spam in chat' })]));
      setAdminDeveloperStatus.mockResolvedValue(SUSPENDED_DEVELOPER);
      renderPage({ withToaster: true });

      await user.click(await screen.findByRole('button', { name: 'Suspend dev@example.com' }));
      const dialog = await screen.findByRole('alertdialog');
      await chooseOption(user, within(dialog).getByLabelText('Reason'), 'Abuse');
      await user.type(within(dialog).getByLabelText(/Internal note/), 'Spam in chat');
      await user.click(within(dialog).getByRole('button', { name: 'Suspend developer' }));

      expect(setAdminDeveloperStatus).toHaveBeenCalledWith({
        developerId: DEVELOPER_ID,
        status: 'suspended',
        reason: 'abuse',
        note: 'Spam in chat',
      });
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      expect(screen.getByRole('status', { name: 'Notifications' })).toHaveTextContent('Developer suspended');
      // The status, and the button, now offer the opposite; the history has the new entry.
      expect(await screen.findByRole('button', { name: 'Resume dev@example.com' })).toBeInTheDocument();
      expect(await screen.findByText('Spam in chat')).toBeInTheDocument();
    });

    it('resumes a developer after a confirmation that asks for no reason', async () => {
      const user = userEvent.setup();
      getAdminDeveloper
        .mockResolvedValueOnce(SUSPENDED_DEVELOPER)
        .mockResolvedValue(buildAdminDeveloperDetail({ id: DEVELOPER_ID }));
      setAdminDeveloperStatus.mockResolvedValue(buildAdminDeveloperDetail({ id: DEVELOPER_ID }));
      renderPage({ withToaster: true });

      await user.click(await screen.findByRole('button', { name: 'Resume dev@example.com' }));

      const dialog = await screen.findByRole('alertdialog', { name: 'Resume this developer?' });
      expect(within(dialog).queryByLabelText('Reason')).not.toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: 'Resume developer' }));
      expect(setAdminDeveloperStatus).toHaveBeenCalledWith({ developerId: DEVELOPER_ID, status: 'active' });
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      expect(screen.getByRole('status', { name: 'Notifications' })).toHaveTextContent('Developer resumed');
      expect(await screen.findByRole('button', { name: 'Suspend dev@example.com' })).toBeInTheDocument();
    });

    it("suspends one game and leaves the developer's status alone", async () => {
      const user = userEvent.setup();
      getAdminDeveloper.mockResolvedValue(ACTIVE_DEVELOPER);
      setAdminGameStatus.mockResolvedValue(buildAdminGame({ id: 'g1', status: 'suspended' }));
      renderPage({ withToaster: true });

      await user.click(await screen.findByRole('button', { name: 'Suspend Farm Friends' }));

      const dialog = await screen.findByRole('alertdialog', { name: 'Suspend Farm Friends?' });
      expect(within(dialog).getByText('dev@example.com')).toBeInTheDocument();
      await chooseOption(user, within(dialog).getByLabelText('Reason'), 'Non-payment');
      await user.click(within(dialog).getByRole('button', { name: 'Suspend game' }));

      expect(setAdminGameStatus).toHaveBeenCalledWith({
        gameId: 'g1',
        status: 'suspended',
        reason: 'non_payment',
        note: '',
      });
      expect(setAdminDeveloperStatus).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      expect(screen.getByRole('status', { name: 'Notifications' })).toHaveTextContent('Game suspended');
    });

    it('resumes one game after a confirmation', async () => {
      const user = userEvent.setup();
      getAdminDeveloper.mockResolvedValue(SUSPENDED_DEVELOPER);
      setAdminGameStatus.mockResolvedValue(buildAdminGame({ id: 'g2' }));
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Resume Space Raiders' }));
      const dialog = await screen.findByRole('alertdialog', { name: 'Resume Space Raiders?' });
      await user.click(within(dialog).getByRole('button', { name: 'Resume game' }));

      expect(setAdminGameStatus).toHaveBeenCalledWith({ gameId: 'g2', status: 'active' });
    });

    it('shows the error in the dialog and changes nothing when the request fails', async () => {
      const user = userEvent.setup();
      getAdminDeveloper.mockResolvedValue(ACTIVE_DEVELOPER);
      setAdminDeveloperStatus.mockRejectedValue(
        new ApiError({ status: 500, code: 'internal_error', message: 'boom' }),
      );
      renderPage({ withToaster: true });

      await user.click(await screen.findByRole('button', { name: 'Suspend dev@example.com' }));
      const dialog = await screen.findByRole('alertdialog');
      await chooseOption(user, within(dialog).getByLabelText('Reason'), 'Other');
      await user.click(within(dialog).getByRole('button', { name: 'Suspend developer' }));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(/nothing was changed/i);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(getAdminDeveloper).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('status', { name: 'Notifications' })).toBeEmptyDOMElement();
      // Still the reason the admin chose, so they can retry without filling it in again.
      expect(within(dialog).getByLabelText('Reason')).toHaveAttribute('data-value', 'other');
      expect(within(dialog).getByRole('button', { name: 'Suspend developer' })).toBeEnabled();
    });

    it('says the developer no longer exists when the server answers 404', async () => {
      const user = userEvent.setup();
      getAdminDeveloper.mockResolvedValue(ACTIVE_DEVELOPER);
      setAdminDeveloperStatus.mockRejectedValue(
        new ApiError({ status: 404, code: 'developer_not_found', message: 'Developer not found' }),
      );
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Suspend dev@example.com' }));
      const dialog = await screen.findByRole('alertdialog');
      await chooseOption(user, within(dialog).getByLabelText('Reason'), 'Abuse');
      await user.click(within(dialog).getByRole('button', { name: 'Suspend developer' }));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(/no longer exists/i);
    });

    it('closes with Cancel without sending anything, and starts empty the next time', async () => {
      const user = userEvent.setup();
      getAdminDeveloper.mockResolvedValue(ACTIVE_DEVELOPER);
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Suspend dev@example.com' }));
      let dialog = await screen.findByRole('alertdialog');
      await chooseOption(user, within(dialog).getByLabelText('Reason'), 'Abuse');
      await user.type(within(dialog).getByLabelText(/Internal note/), 'draft');
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(setAdminDeveloperStatus).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Suspend dev@example.com' }));
      dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByLabelText('Reason')).toHaveAttribute('data-value', '');
      expect(within(dialog).getByLabelText(/Internal note/)).toHaveValue('');
    });

    it('is keyboard-operable: focus starts on the reason, Escape closes and focus returns', async () => {
      const user = userEvent.setup();
      getAdminDeveloper.mockResolvedValue(ACTIVE_DEVELOPER);
      renderPage();
      const trigger = await screen.findByRole('button', { name: 'Suspend dev@example.com' });

      trigger.focus();
      await user.keyboard('{Enter}');
      const dialog = await screen.findByRole('alertdialog');

      expect(within(dialog).getByLabelText('Reason')).toHaveFocus();
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    });

    it('cannot be cancelled or confirmed twice while the request is in flight', async () => {
      const user = userEvent.setup();
      getAdminDeveloper.mockResolvedValue(ACTIVE_DEVELOPER);
      setAdminDeveloperStatus.mockReturnValue(new Promise(() => {}));
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Suspend dev@example.com' }));
      const dialog = await screen.findByRole('alertdialog');
      await chooseOption(user, within(dialog).getByLabelText('Reason'), 'Abuse');
      await user.click(within(dialog).getByRole('button', { name: 'Suspend developer' }));

      expect(within(dialog).getByRole('button', { name: 'Working…' })).toBeDisabled();
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(setAdminDeveloperStatus).toHaveBeenCalledTimes(1);
    });

    it('stops the note at 1000 characters and shows the count', async () => {
      const user = userEvent.setup();
      getAdminDeveloper.mockResolvedValue(ACTIVE_DEVELOPER);
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Suspend dev@example.com' }));
      const dialog = await screen.findByRole('alertdialog');
      await user.type(within(dialog).getByLabelText(/Internal note/), 'abc');

      expect(within(dialog).getByText('3/1000')).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/Internal note/)).toHaveAttribute('maxlength', '1000');
    });
  });
});
