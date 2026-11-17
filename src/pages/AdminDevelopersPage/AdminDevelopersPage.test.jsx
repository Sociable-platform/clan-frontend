import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listAdminDevelopers } from '@/features/admin/api/adminApi';
import { ApiError } from '@/shared/api';
import { buildAdminDeveloper, buildAdminDeveloperPage } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';
import { chooseOption } from '@/test/selectField';

import { AdminDevelopersPage } from './AdminDevelopersPage';

vi.mock('@/features/admin/api/adminApi');

function renderPage() {
  return renderWithRouter([{ path: '/admin/developers', element: <AdminDevelopersPage /> }], {
    initialEntries: ['/admin/developers'],
  });
}

const ANN = buildAdminDeveloper({ id: 'd1', email: 'ann@example.com', name: 'Ann Lee', gameCount: 3 });
const BOB = buildAdminDeveloper({
  id: 'd2',
  email: 'bob@example.com',
  name: '',
  status: 'suspended',
  isSuspended: true,
  gameCount: 0,
});

describe('AdminDevelopersPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('announces loading and shows a table-shaped skeleton while the list is fetched', () => {
    listAdminDevelopers.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading developers');
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows email, name, status, game count and created date for each developer', async () => {
    listAdminDevelopers.mockResolvedValue(buildAdminDeveloperPage([ANN, BOB]));

    renderPage();

    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2 developers
    expect(within(rows[1]).getByRole('link', { name: 'Ann Lee' })).toBeInTheDocument();
    expect(within(rows[1]).getByText('ann@example.com')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Active')).toBeInTheDocument();
    expect(within(rows[1]).getByText('3')).toBeInTheDocument();
    expect(within(rows[1]).getByText(/2026/)).toBeInTheDocument();
    // A developer with no name shows the email as the link text, once.
    expect(within(rows[2]).getByRole('link', { name: 'bob@example.com' })).toBeInTheDocument();
    expect(within(rows[2]).getByText('Suspended')).toBeInTheDocument();
  });

  it('links each row to the developer detail page', async () => {
    listAdminDevelopers.mockResolvedValue(buildAdminDeveloperPage([ANN]));

    renderPage();

    expect(await screen.findByRole('link', { name: 'Ann Lee' })).toHaveAttribute('href', '/admin/developers/d1');
  });

  it('shows an empty state when there are no developers at all', async () => {
    listAdminDevelopers.mockResolvedValue(buildAdminDeveloperPage([]));

    renderPage();

    expect(await screen.findByText('No developers yet')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows an error with a retry that loads the list', async () => {
    listAdminDevelopers.mockRejectedValueOnce(new ApiError({ status: 500, code: 'internal', message: 'boom' }));
    listAdminDevelopers.mockResolvedValueOnce(buildAdminDeveloperPage([ANN]));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load developers');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Ann Lee' })).toBeInTheDocument();
  });

  it('filters by status through the server', async () => {
    const user = userEvent.setup();
    listAdminDevelopers.mockImplementation(async ({ status }) =>
      buildAdminDeveloperPage(status === 'suspended' ? [BOB] : [ANN, BOB]),
    );
    renderPage();
    await screen.findByRole('link', { name: 'Ann Lee' });

    await chooseOption(user, screen.getByLabelText('Status'), 'Suspended');

    expect(await screen.findByText('1 developers shown')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ann Lee' })).not.toBeInTheDocument();
    expect(listAdminDevelopers).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'suspended' }));
  });

  it('says nothing matches, not "no developers yet", when a filter finds no one', async () => {
    const user = userEvent.setup();
    listAdminDevelopers.mockImplementation(async ({ status }) =>
      buildAdminDeveloperPage(status === 'suspended' ? [] : [ANN]),
    );
    renderPage();
    await screen.findByRole('link', { name: 'Ann Lee' });

    await chooseOption(user, screen.getByLabelText('Status'), 'Suspended');

    expect(await screen.findByText('No developers match')).toBeInTheDocument();
    expect(screen.queryByText('No developers yet')).not.toBeInTheDocument();
  });

  describe('search', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    it('waits for typing to pause, then searches once with the whole text', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      listAdminDevelopers.mockResolvedValue(buildAdminDeveloperPage([ANN]));
      renderPage();
      await screen.findByRole('link', { name: 'Ann Lee' });
      listAdminDevelopers.mockClear();

      await user.type(screen.getByLabelText('Search'), 'ann');
      expect(listAdminDevelopers).not.toHaveBeenCalled();
      await act(() => vi.advanceTimersByTimeAsync(400));

      expect(listAdminDevelopers).toHaveBeenCalledTimes(1);
      expect(listAdminDevelopers).toHaveBeenCalledWith(expect.objectContaining({ q: 'ann' }));
    });

    it('keeps the old rows on screen while the new search loads', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      listAdminDevelopers.mockResolvedValueOnce(buildAdminDeveloperPage([ANN, BOB]));
      renderPage();
      await screen.findByRole('link', { name: 'Ann Lee' });
      listAdminDevelopers.mockReturnValue(new Promise(() => {}));

      await user.type(screen.getByLabelText('Search'), 'x');
      await act(() => vi.advanceTimersByTimeAsync(400));

      expect(screen.getByRole('link', { name: 'Ann Lee' })).toBeInTheDocument();
      expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
      expect(document.querySelectorAll('.skeleton')).toHaveLength(0);
    });

    it('limits the search box to what the server accepts', () => {
      listAdminDevelopers.mockReturnValue(new Promise(() => {}));
      renderPage();

      expect(screen.getByLabelText('Search')).toHaveAttribute('maxlength', '100');
    });
  });

  describe('paging', () => {
    it('loads the next page with the cursor and appends it', async () => {
      const user = userEvent.setup();
      listAdminDevelopers
        .mockResolvedValueOnce(buildAdminDeveloperPage([ANN], 'cursor-2'))
        .mockResolvedValueOnce(buildAdminDeveloperPage([BOB], null));
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Load more' }));

      expect(await screen.findByRole('link', { name: 'bob@example.com' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Ann Lee' })).toBeInTheDocument();
      expect(listAdminDevelopers).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'cursor-2' }));
      expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    });

    it('has no Load more button on the last page', async () => {
      listAdminDevelopers.mockResolvedValue(buildAdminDeveloperPage([ANN], null));

      renderPage();

      await screen.findByRole('link', { name: 'Ann Lee' });
      expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    });

    it('keeps the rows and says so when loading more fails', async () => {
      const user = userEvent.setup();
      listAdminDevelopers
        .mockResolvedValueOnce(buildAdminDeveloperPage([ANN], 'cursor-2'))
        .mockRejectedValueOnce(new ApiError({ status: 500, code: 'internal', message: 'boom' }));
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Load more' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Could not load more developers');
      expect(screen.getByRole('link', { name: 'Ann Lee' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Load more' })).toBeEnabled();
    });
  });
});
