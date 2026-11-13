import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminDeveloper, listAdminAuditLog } from '@/features/admin/api/adminApi';
import { ApiError } from '@/shared/api';
import {
  buildAdminDeveloperDetail,
  buildAdminGame,
  buildAuditEntry,
  buildAuditPage,
} from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { AdminDeveloperDetailPage } from './AdminDeveloperDetailPage';

vi.mock('@/features/admin/api/adminApi');

const DEVELOPER_ID = 'd1';

function renderPage() {
  return renderWithRouter(
    [
      { path: '/admin/developers', element: <p>Developers list</p> },
      { path: '/admin/developers/:developerId', element: <AdminDeveloperDetailPage /> },
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
});
