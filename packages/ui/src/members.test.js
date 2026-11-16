import { fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockData } from './data/mockData.js';
import { loadExample, mount } from './testUtils.js';

afterEach(() => {
  document.body.replaceChildren();
});

const arena = () => loadExample('valid/arena.json');
const role = (id, extra = {}) => ({ id, name: id[0].toUpperCase() + id.slice(1), canPromote: false, canKick: false, ...extra });
const openMembers = (config, viewerRole, actions = {}) =>
  mount(config, { ...createMockData(config, { viewerRole }), screen: 'members', open: true, actions });
const rowOf = (ui, name) => ui().getByRole('button', { name: new RegExp(`^${name}, `) });

describe('members screen: managing a member', () => {
  it('lists the roster most powerful first, and marks you', () => {
    const config = arena();
    const { root } = openMembers(config, 'co-leader');

    expect([...root().querySelectorAll('.sk-row .sk-name')].map((name) => name.textContent)).toEqual(['Alex', 'Sam (you)', 'Cara', 'Dana']);
    expect([...root().querySelectorAll('.sk-role')].map((pill) => pill.textContent)).toEqual(['Leader', 'Co-leader', 'Elder', 'Member']);
    expect(root().querySelector('.sk-role[data-top="true"]')).toHaveTextContent('Leader');
  });

  it('turns every member but the viewer into a button, named Manage only when the viewer may manage them', () => {
    const config = arena();
    const { ui } = openMembers(config, 'co-leader');

    expect(rowOf(ui, 'Cara')).toHaveAttribute('aria-expanded', 'false');
    expect(rowOf(ui, 'Cara')).toHaveAccessibleName('Cara, Elder. Manage');
    expect(rowOf(ui, 'Dana')).toBeInTheDocument();
    expect(rowOf(ui, 'Alex')).toHaveAccessibleName('Alex, Leader. Options');
    expect(ui().queryByRole('button', { name: /^Sam, / })).not.toBeInTheDocument();
  });

  it('gives the leader promote, demote and kick for each lower role, one step at a time', () => {
    const config = arena();
    const { ui } = openMembers(config, 'leader');

    fireEvent.click(rowOf(ui, 'Dana'));

    expect(rowOf(ui, 'Dana')).toHaveAttribute('aria-expanded', 'true');
    expect(ui().getByRole('button', { name: 'Promote to Elder' })).toBeInTheDocument();
    expect(ui().queryByRole('button', { name: /^Demote/ })).not.toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Kick' })).toBeInTheDocument();

    fireEvent.click(rowOf(ui, 'Ben'));

    expect(ui().queryByRole('button', { name: /^Promote/ })).not.toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Demote to Elder' })).toBeInTheDocument();
  });

  it('shows the role each button leads to, and puts the role line under the friend line', () => {
    const config = arena();
    const { ui, root } = openMembers(config, 'leader');

    fireEvent.click(rowOf(ui, 'Cara'));

    expect(ui().getByRole('button', { name: 'Promote to Co-leader' })).toHaveTextContent(/^Co-leader$/);
    expect(ui().getByRole('button', { name: 'Demote to Member' })).toHaveTextContent(/^Member$/);
    const panel = root().querySelector('.sk-member-panel');
    expect([...panel.children].map((line) => line.textContent)).toEqual(['Add friend', 'Co-leaderMemberKick']);
    // Kick is the last thing on the role line, apart from the role buttons.
    expect(panel.querySelector('.sk-member-roles').lastElementChild).toHaveClass('sk-btn-danger-text');
  });

  it('has no role line for a member the viewer cannot manage, only Add friend', () => {
    const config = arena();
    const { ui, root } = openMembers(config, 'member');

    fireEvent.click(rowOf(ui, 'Alex'));

    expect(root().querySelector('.sk-member-roles')).toBeNull();
    expect(ui().getByRole('button', { name: 'Add Alex as a friend' })).toHaveTextContent(/^Add friend$/);
  });

  it('opens one member at a time and closes it on a second click', () => {
    const config = arena();
    const { ui, root } = openMembers(config, 'leader');

    fireEvent.click(rowOf(ui, 'Dana'));
    fireEvent.click(rowOf(ui, 'Cara'));

    expect(root().querySelectorAll('.sk-member-panel')).toHaveLength(1);
    expect(rowOf(ui, 'Dana')).toHaveAttribute('aria-expanded', 'false');
    expect(ui().getByRole('group', { name: 'Manage Cara' })).toBeInTheDocument();

    fireEvent.click(rowOf(ui, 'Cara'));

    expect(root().querySelectorAll('.sk-member-panel')).toHaveLength(0);
  });

  it('promotes and demotes through the host', () => {
    const config = arena();
    const actions = { setRole: vi.fn() };
    const { ui } = openMembers(config, 'leader', actions);

    fireEvent.click(rowOf(ui, 'Cara'));
    fireEvent.click(ui().getByRole('button', { name: 'Promote to Co-leader' }));
    fireEvent.click(ui().getByRole('button', { name: 'Demote to Member' }));

    expect(actions.setRole).toHaveBeenNthCalledWith(1, 'm-2', 'co-leader');
    expect(actions.setRole).toHaveBeenNthCalledWith(2, 'm-2', 'member');
  });

  it('never offers to promote someone to the viewer\'s own role', () => {
    const config = arena();
    const { ui } = openMembers(config, 'co-leader');

    fireEvent.click(rowOf(ui, 'Cara'));

    expect(ui().queryByRole('button', { name: /^Promote/ })).not.toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Demote to Member' })).toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Kick' })).toBeInTheDocument();
  });

  it('asks before kicking, and kicks through the host only after confirming', () => {
    const config = arena();
    const actions = { kick: vi.fn() };
    const { ui } = openMembers(config, 'leader', actions);

    fireEvent.click(rowOf(ui, 'Dana'));
    fireEvent.click(ui().getByRole('button', { name: 'Kick' }));

    expect(ui().getByRole('alertdialog', { name: 'Kick Dana' })).toBeInTheDocument();
    expect(ui().getByText('Kick Dana from Nova Squad?')).toBeInTheDocument();
    expect(actions.kick).not.toHaveBeenCalled();

    fireEvent.click(ui().getByRole('button', { name: 'Cancel' }));

    expect(ui().queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(actions.kick).not.toHaveBeenCalled();

    fireEvent.click(ui().getByRole('button', { name: 'Kick' }));
    fireEvent.click(within(ui().getByRole('alertdialog')).getByRole('button', { name: 'Kick' }));

    expect(actions.kick).toHaveBeenCalledWith('m-3');
  });

  it('only shows what the role allows: promote without kick, or nothing', () => {
    const config = arena();
    config.clan.roles = [role('member'), role('elder'), role('senior', { canPromote: true }), role('leader')];
    const { ui } = openMembers(config, 'senior');

    fireEvent.click(rowOf(ui, 'Dana'));

    expect(ui().getByRole('button', { name: 'Promote to Elder' })).toBeInTheDocument();
    expect(ui().queryByRole('button', { name: 'Kick' })).not.toBeInTheDocument();
  });

  it.each([
    ['a role with no powers', 'elder'],
    ['the lowest role', 'member'],
  ])('offers no promote, demote or kick to %s', (_name, viewerRole) => {
    const config = arena();
    const { ui } = openMembers(config, viewerRole);

    fireEvent.click(rowOf(ui, 'Alex'));

    expect(ui().getByRole('group', { name: 'Options for Alex' })).toBeInTheDocument();
    expect(ui().queryByRole('button', { name: /^(Promote|Demote|Kick)/ })).not.toBeInTheDocument();
  });

  it('offers nothing when the viewer is not in the list', () => {
    const config = arena();
    const { root } = mount(config, { ...createMockData(config), screen: 'members', open: true });

    expect(root().querySelectorAll('.sk-row-button')).toHaveLength(0);
  });

  it('closes the panel when the host removes the member', () => {
    const config = arena();
    const data = { ...createMockData(config, { viewerRole: 'leader' }), screen: 'members', open: true };
    const { handle, ui, root } = mount(config, data);
    fireEvent.click(rowOf(ui, 'Dana'));

    handle.update(config, { ...data, members: data.members.filter((member) => member.name !== 'Dana') });

    expect(root().querySelectorAll('.sk-member-panel')).toHaveLength(0);
    expect(ui().queryByText('Dana')).not.toBeInTheDocument();
  });

  it('shows the new role after the host changes it', () => {
    const config = arena();
    const data = { ...createMockData(config, { viewerRole: 'leader' }), screen: 'members', open: true };
    const { handle, ui } = mount(config, data);
    fireEvent.click(rowOf(ui, 'Dana'));

    handle.update(config, { ...data, members: data.members.map((member) => (member.name === 'Dana' ? { ...member, role: 'elder' } : member)) });

    expect(rowOf(ui, 'Dana')).toHaveAttribute('aria-expanded', 'true');
    expect(ui().getByRole('button', { name: 'Promote to Co-leader' })).toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Demote to Member' })).toBeInTheDocument();
  });

  it('works with as many roles as the game defines', () => {
    const config = arena();
    config.clan.roles = ['recruit', 'member', 'veteran', 'elder', 'captain', 'general', 'co-leader', 'leader'].map((id) =>
      role(id, { canPromote: id !== 'recruit', canKick: id !== 'recruit' }),
    );
    const { ui } = openMembers(config, 'general');

    expect(ui().getAllByRole('button', { name: /Manage$/ }).length).toBeGreaterThan(0);
    expect(ui().getByText('Co-leader')).toBeInTheDocument();
  });

  it('reads the old owner and member words as the last and the first role', () => {
    const config = arena();
    const data = createMockData(config, { viewerRole: 'leader' });
    const members = data.members.map((member) => ({ ...member, role: member.role === 'leader' ? 'owner' : member.role === 'member' ? 'member' : 'member' }));
    const { ui } = mount(config, { ...data, members, screen: 'members', open: true });

    expect(ui().getAllByText('Leader')).toHaveLength(1);
    expect(ui().getAllByText('Member').length).toBeGreaterThan(0);
  });
});

describe('members screen: adding a member as a friend', () => {
  it('offers Add friend for any member, whatever the viewer\'s role, and asks the host', () => {
    const config = arena();
    const actions = { addFriend: vi.fn() };
    const { ui } = openMembers(config, 'member', actions);

    fireEvent.click(rowOf(ui, 'Alex'));
    fireEvent.click(ui().getByRole('button', { name: 'Add Alex as a friend' }));

    expect(actions.addFriend).toHaveBeenCalledWith('m-0');
  });

  it('puts Add friend beside promote, demote and kick for a member the viewer manages', () => {
    const config = arena();
    const { ui } = openMembers(config, 'leader');

    fireEvent.click(rowOf(ui, 'Dana'));

    expect(ui().getByRole('group', { name: 'Manage Dana' })).toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Add Dana as a friend' })).toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Kick' })).toBeInTheDocument();
  });

  it('does not offer it for the viewer, nor when the viewer is not in the list', () => {
    const config = arena();
    const { ui, root } = openMembers(config, 'member');

    expect(ui().queryByRole('button', { name: /^Sam, / })).not.toBeInTheDocument();

    const other = mount(config, { ...createMockData(config), screen: 'members', open: true });
    expect(other.root().querySelectorAll('.sk-row-button')).toHaveLength(0);
    expect(root().querySelectorAll('.sk-member-panel')).toHaveLength(0);
  });

  it('shows "Friends" for a member who is already a friend, and offers no button', () => {
    const config = arena();
    const data = { ...createMockData(config, { viewerRole: 'member' }), screen: 'members', open: true };
    data.friends = [{ id: 'm-0', name: 'Alex', status: 'In arena', online: true }];
    const { ui } = mount(config, data);

    fireEvent.click(rowOf(ui, 'Alex'));

    expect(within(ui().getByRole('group', { name: 'Options for Alex' })).getByText('Friends')).toBeInTheDocument();
    expect(ui().queryByRole('button', { name: 'Add Alex as a friend' })).not.toBeInTheDocument();
  });

  it('shows "Friend request sent" with Undo once the host marks the request, and Add friend again after Undo', () => {
    const config = arena();
    const actions = { cancelFriendRequest: vi.fn() };
    const data = { ...createMockData(config, { viewerRole: 'member' }), screen: 'members', open: true, actions };
    const { handle, ui } = mount(config, data);
    const withRelation = (relation) => ({ ...data, members: data.members.map((member) => (member.id === 'm-0' ? { ...member, relation, requestId: 'req-1' } : member)) });
    fireEvent.click(rowOf(ui, 'Alex'));

    handle.update(config, withRelation('request_sent'));

    expect(ui().getByText('Friend request sent')).toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Cancel friend request to Alex' })).toHaveTextContent(/^Undo$/);
    expect(ui().queryByRole('button', { name: 'Add Alex as a friend' })).not.toBeInTheDocument();

    fireEvent.click(ui().getByRole('button', { name: 'Cancel friend request to Alex' }));

    expect(actions.cancelFriendRequest).toHaveBeenCalledWith('m-0', 'req-1');

    handle.update(config, withRelation('none'));

    expect(ui().getByRole('button', { name: 'Add Alex as a friend' })).toBeInTheDocument();
    expect(ui().queryByRole('button', { name: /^Cancel friend request/ })).not.toBeInTheDocument();
  });

  it('offers Accept when the member asked first, which sends the request back', () => {
    const config = arena();
    const actions = { addFriend: vi.fn() };
    const data = { ...createMockData(config, { viewerRole: 'member' }), screen: 'members', open: true, actions };
    data.members = data.members.map((member) => (member.id === 'm-0' ? { ...member, relation: 'request_received' } : member));
    const { ui } = mount(config, data);

    fireEvent.click(rowOf(ui, 'Alex'));
    fireEvent.click(ui().getByRole('button', { name: 'Accept friend request from Alex' }));

    expect(actions.addFriend).toHaveBeenCalledWith('m-0');
  });

  it('is not offered for a player the viewer blocked, who stays a plain row', () => {
    const config = arena();
    const data = { ...createMockData(config, { viewerRole: 'member' }), screen: 'members', open: true };
    data.blocked = [{ id: 'm-0', name: 'Alex' }];
    const { ui } = mount(config, data);

    expect(ui().queryByRole('button', { name: /^Alex, / })).not.toBeInTheDocument();
  });
});
