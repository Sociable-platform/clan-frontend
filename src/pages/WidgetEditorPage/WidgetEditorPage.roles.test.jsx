import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listGames } from '@/features/games/api/gamesApi';
import { getWidgetDraft, listWidgetVersions, saveWidgetDraft } from '@/features/widget/api/widgetApi';
import { buildGame, buildWidgetConfig } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { WidgetEditorPage } from './WidgetEditorPage';

vi.mock('@/features/widget/api/widgetApi');
vi.mock('@/features/games/api/gamesApi');

const renderEditor = () =>
  renderWithRouter([{ path: '/games/:gameId/widget', element: <WidgetEditorPage /> }], { initialEntries: ['/games/g1/widget'] });

const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const rawConfig = () => JSON.parse(screen.getByLabelText('Draft config (read-only JSON)').value);
const roleIds = () => rawConfig().clan.roles.map((role) => role.id);
const roleList = () => within(screen.getByRole('list', { name: 'Clan roles, strongest first' }));
const rowNames = () => roleList().getAllByRole('listitem').map((item) => item.querySelector('.role-item-name').textContent);
const rowOf = (name) => roleList().getByRole('button', { name: new RegExp(`^${name}\\b`) }).closest('li');
const selectRole = async (user, name) => user.click(roleList().getByRole('button', { name: new RegExp(`^${name}\\b`) }));
const dragRole = (from, to) => {
  const dataTransfer = { setData: vi.fn(), effectAllowed: '' };
  fireEvent.dragStart(rowOf(from), { dataTransfer });
  fireEvent.dragOver(rowOf(to), { dataTransfer });
  fireEvent.drop(rowOf(to), { dataTransfer });
  fireEvent.dragEnd(rowOf(from), { dataTransfer });
};

async function openRoles(user) {
  await user.click(await screen.findByRole('tab', { name: 'Clan' }));
}

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

describe('clan roles list', () => {
  it('lists the roles strongest first with what each may do', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    expect(rowNames()).toEqual(['Leader', 'Co-leader', 'Elder', 'Member']);
    expect(rowOf('Leader')).toHaveTextContent('Every power');
    expect(rowOf('Co-leader')).toHaveTextContent('Promote · Kick');
    expect(rowOf('Elder')).toHaveTextContent('No powers');
    expect(screen.getByText('4 of 12')).toBeInTheDocument();
  });

  it('lets only the roles in between be dragged', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    expect(rowOf('Leader')).toHaveAttribute('draggable', 'false');
    expect(rowOf('Member')).toHaveAttribute('draggable', 'false');
    expect(rowOf('Co-leader')).toHaveAttribute('draggable', 'true');
    expect(rowOf('Elder')).toHaveAttribute('draggable', 'true');
  });

  it('has no big edit form until a role is clicked', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    expect(screen.queryByRole('textbox', { name: 'Title' })).not.toBeInTheDocument();
    expect(screen.getByText(/Click a role to edit/)).toBeInTheDocument();

    await selectRole(user, 'Elder');

    expect(screen.getByRole('region', { name: 'Edit Elder' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Elder');
    expect(rowOf('Elder')).toHaveClass('role-item-selected');

    await selectRole(user, 'Elder');

    expect(screen.queryByRole('region', { name: /^Edit/ })).not.toBeInTheDocument();
  });

  it('shows one role at a time', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    await selectRole(user, 'Elder');
    await selectRole(user, 'Co-leader');

    expect(screen.getAllByRole('region', { name: /^Edit/ })).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Edit Co-leader' })).toBeInTheDocument();
  });
});

describe('dragging roles', () => {
  it('moves a role to where it is dropped', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    dragRole('Elder', 'Co-leader');

    expect(rowNames()).toEqual(['Leader', 'Elder', 'Co-leader', 'Member']);
    expect(roleIds()).toEqual(['member', 'co-leader', 'elder', 'leader']);
  });

  it('puts a role dropped on the owner just below it, and keeps the owner and lowest roles in place', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    dragRole('Elder', 'Leader');

    expect(roleIds()).toEqual(['member', 'co-leader', 'elder', 'leader']);

    dragRole('Leader', 'Co-leader');
    dragRole('Member', 'Elder');

    expect(roleIds()).toEqual(['member', 'co-leader', 'elder', 'leader']);
  });

  it('marks the role being dragged and where it would land', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };

    fireEvent.dragStart(rowOf('Elder'), { dataTransfer });
    fireEvent.dragOver(rowOf('Co-leader'), { dataTransfer });

    expect(rowOf('Elder')).toHaveClass('role-item-dragging');
    expect(rowOf('Co-leader')).toHaveClass('role-item-over');

    fireEvent.dragEnd(rowOf('Elder'), { dataTransfer });

    expect(rowOf('Elder')).not.toHaveClass('role-item-dragging');
    expect(rowOf('Co-leader')).not.toHaveClass('role-item-over');
  });

  it('keeps the selected role selected after it moves', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);
    await selectRole(user, 'Elder');

    dragRole('Elder', 'Co-leader');

    expect(screen.getByRole('region', { name: 'Edit Elder' })).toBeInTheDocument();
    expect(rowOf('Elder')).toHaveClass('role-item-selected');
  });

  it('can also be moved with buttons, for keyboards and touch screens', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);
    await selectRole(user, 'Elder');

    await user.click(screen.getByRole('button', { name: 'Move up' }));

    expect(roleIds()).toEqual(['member', 'co-leader', 'elder', 'leader']);

    await user.click(screen.getByRole('button', { name: 'Move up' }));

    expect(roleIds()).toEqual(['member', 'co-leader', 'elder', 'leader']);

    await user.click(screen.getByRole('button', { name: 'Move down' }));

    expect(roleIds()).toEqual(['member', 'elder', 'co-leader', 'leader']);
  });
});

describe('editing a role', () => {
  it('lets a clicked role be allowed to kick the roles below it', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);
    await selectRole(user, 'Elder');

    expect(screen.getByRole('switch', { name: 'Can kick roles below it' })).not.toBeChecked();

    await user.click(screen.getByRole('switch', { name: 'Can kick roles below it' }));

    expect(rawConfig().clan.roles.find((role) => role.id === 'elder')).toEqual({ id: 'elder', name: 'Elder', canPromote: false, canKick: true });
    expect(rowOf('Elder')).toHaveTextContent('Kick');
  });

  it('lets it be allowed to promote and demote too', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);
    await selectRole(user, 'Elder');

    await user.click(screen.getByRole('switch', { name: 'Can promote and demote roles below it' }));

    expect(rawConfig().clan.roles.find((role) => role.id === 'elder').canPromote).toBe(true);
    expect(rowOf('Elder')).toHaveTextContent('Promote');
  });

  it('turns kicking off again', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);
    await selectRole(user, 'Co-leader');

    await user.click(screen.getByRole('switch', { name: 'Can kick roles below it' }));

    expect(rowOf('Co-leader')).toHaveTextContent('Promote');
    expect(rowOf('Co-leader')).not.toHaveTextContent('Kick');
  });

  it('renames a role without changing its id', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);
    await selectRole(user, 'Elder');
    const title = screen.getByRole('textbox', { name: 'Title' });

    await user.clear(title);
    await user.type(title, 'Veteran');

    expect(rawConfig().clan.roles[1]).toMatchObject({ id: 'elder', name: 'Veteran' });
    expect(rowNames()).toContain('Veteran');
  });

  it('gives the owner and the lowest role a title but no powers to set', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    await selectRole(user, 'Leader');

    expect(screen.getByText('The owner role always has every power.')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Edit Leader' })).queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove role' })).not.toBeInTheDocument();

    await selectRole(user, 'Member');

    expect(screen.getByText(/Nobody is below this role/)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Edit Member' })).queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove role' })).not.toBeInTheDocument();
  });

  it('removes a role in between', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);
    await selectRole(user, 'Elder');

    await user.click(screen.getByRole('button', { name: 'Remove role' }));

    expect(roleIds()).toEqual(['member', 'co-leader', 'leader']);
    expect(screen.queryByRole('region', { name: /^Edit/ })).not.toBeInTheDocument();
  });
});

describe('adding a role', () => {
  it('adds it just below the owner role, named by its title, and selects it', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    await user.type(screen.getByRole('textbox', { name: 'New role title' }), 'Grand Master');
    await user.click(screen.getByRole('button', { name: 'Add role' }));

    expect(roleIds()).toEqual(['member', 'elder', 'co-leader', 'grand-master', 'leader']);
    expect(rawConfig().clan.roles[3]).toEqual({ id: 'grand-master', name: 'Grand Master', canPromote: false, canKick: false });
    expect(rowNames()).toEqual(['Leader', 'Grand Master', 'Co-leader', 'Elder', 'Member']);
    expect(screen.getByRole('region', { name: 'Edit Grand Master' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'New role title' })).toHaveValue('');
  });

  it('adds with Enter and refuses a bad title with a reason', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);
    const input = screen.getByRole('textbox', { name: 'New role title' });

    await user.type(input, '<b>Boss</b>{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('Use plain text');
    expect(roleIds()).toHaveLength(4);

    await user.clear(input);
    await user.type(input, 'Scout{Enter}');

    expect(roleIds()).toContain('scout');
  });

  it('stops at 12 roles', async () => {
    getWidgetDraft.mockResolvedValue(
      buildWidgetConfig((draft) => {
        draft.clan.roles = Array.from({ length: 12 }, (_, index) => ({ id: `rank-${index}`, name: `Rank ${index}`, canPromote: false, canKick: false }));
      }),
    );
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    expect(screen.getByRole('button', { name: 'Add role' })).toBeDisabled();
    expect(screen.getByText('A game can have up to 12 roles.')).toBeInTheDocument();
  });

  it('offers the new role in the preview, in its place', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    await user.type(screen.getByRole('textbox', { name: 'New role title' }), 'Scout{Enter}');

    const options = within(screen.getByRole('combobox', { name: 'Viewing as' })).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Leader', 'Scout', 'Co-leader', 'Elder', 'Member']);
  });

  it('follows the new order in the preview', async () => {
    const user = setupUser();
    renderEditor();
    await openRoles(user);

    dragRole('Elder', 'Co-leader');

    const options = within(screen.getByRole('combobox', { name: 'Viewing as' })).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Leader', 'Elder', 'Co-leader', 'Member']);
  });
});
