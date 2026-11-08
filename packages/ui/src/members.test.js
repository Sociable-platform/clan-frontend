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

    expect([...root().querySelectorAll('.sk-row .sk-name')].map((name) => name.textContent)).toEqual(['Murad', 'Samir (you)', 'Farida', 'Aysel']);
    expect([...root().querySelectorAll('.sk-role')].map((pill) => pill.textContent)).toEqual(['Leader', 'Co-leader', 'Elder', 'Member']);
    expect(root().querySelector('.sk-role[data-top="true"]')).toHaveTextContent('Leader');
  });

  it('turns only the members the viewer may manage into buttons', () => {
    const config = arena();
    const { ui } = openMembers(config, 'co-leader');

    expect(rowOf(ui, 'Farida')).toHaveAttribute('aria-expanded', 'false');
    expect(rowOf(ui, 'Aysel')).toBeInTheDocument();
    expect(ui().queryByRole('button', { name: /^Murad, / })).not.toBeInTheDocument();
    expect(ui().queryByRole('button', { name: /^Samir, / })).not.toBeInTheDocument();
  });

  it('gives the leader promote, demote and kick for each lower role, one step at a time', () => {
    const config = arena();
    const { ui } = openMembers(config, 'leader');

    fireEvent.click(rowOf(ui, 'Aysel'));

    expect(rowOf(ui, 'Aysel')).toHaveAttribute('aria-expanded', 'true');
    expect(ui().getByRole('button', { name: 'Promote to Elder' })).toBeInTheDocument();
    expect(ui().queryByRole('button', { name: /^Demote/ })).not.toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Kick' })).toBeInTheDocument();

    fireEvent.click(rowOf(ui, 'Rashad'));

    expect(ui().queryByRole('button', { name: /^Promote/ })).not.toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Demote to Elder' })).toBeInTheDocument();
  });

  it('labels the buttons Promote and Demote, and keeps the target role in their accessible name', () => {
    const config = arena();
    const { ui } = openMembers(config, 'leader');

    fireEvent.click(rowOf(ui, 'Farida'));

    expect(ui().getByRole('button', { name: 'Promote to Co-leader' })).toHaveTextContent(/^Promote$/);
    expect(ui().getByRole('button', { name: 'Demote to Member' })).toHaveTextContent(/^Demote$/);
  });

  it('opens one member at a time and closes it on a second click', () => {
    const config = arena();
    const { ui, root } = openMembers(config, 'leader');

    fireEvent.click(rowOf(ui, 'Aysel'));
    fireEvent.click(rowOf(ui, 'Farida'));

    expect(root().querySelectorAll('.sk-member-panel')).toHaveLength(1);
    expect(rowOf(ui, 'Aysel')).toHaveAttribute('aria-expanded', 'false');
    expect(ui().getByRole('group', { name: 'Manage Farida' })).toBeInTheDocument();

    fireEvent.click(rowOf(ui, 'Farida'));

    expect(root().querySelectorAll('.sk-member-panel')).toHaveLength(0);
  });

  it('promotes and demotes through the host', () => {
    const config = arena();
    const actions = { setRole: vi.fn() };
    const { ui } = openMembers(config, 'leader', actions);

    fireEvent.click(rowOf(ui, 'Farida'));
    fireEvent.click(ui().getByRole('button', { name: 'Promote to Co-leader' }));
    fireEvent.click(ui().getByRole('button', { name: 'Demote to Member' }));

    expect(actions.setRole).toHaveBeenNthCalledWith(1, 'm-2', 'co-leader');
    expect(actions.setRole).toHaveBeenNthCalledWith(2, 'm-2', 'member');
  });

  it('never offers to promote someone to the viewer\'s own role', () => {
    const config = arena();
    const { ui } = openMembers(config, 'co-leader');

    fireEvent.click(rowOf(ui, 'Farida'));

    expect(ui().queryByRole('button', { name: /^Promote/ })).not.toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Demote to Member' })).toBeInTheDocument();
    expect(ui().getByRole('button', { name: 'Kick' })).toBeInTheDocument();
  });

  it('asks before kicking, and kicks through the host only after confirming', () => {
    const config = arena();
    const actions = { kick: vi.fn() };
    const { ui } = openMembers(config, 'leader', actions);

    fireEvent.click(rowOf(ui, 'Aysel'));
    fireEvent.click(ui().getByRole('button', { name: 'Kick' }));

    expect(ui().getByRole('alertdialog', { name: 'Kick Aysel' })).toBeInTheDocument();
    expect(ui().getByText('Kick Aysel from Nova Squad?')).toBeInTheDocument();
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

    fireEvent.click(rowOf(ui, 'Aysel'));

    expect(ui().getByRole('button', { name: 'Promote to Elder' })).toBeInTheDocument();
    expect(ui().queryByRole('button', { name: 'Kick' })).not.toBeInTheDocument();
  });

  it.each([
    ['a role with no powers', 'elder'],
    ['the lowest role', 'member'],
  ])('offers nothing to %s', (_name, viewerRole) => {
    const config = arena();
    const { root } = openMembers(config, viewerRole);

    expect(root().querySelectorAll('.sk-row-button')).toHaveLength(0);
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
    fireEvent.click(rowOf(ui, 'Aysel'));

    handle.update(config, { ...data, members: data.members.filter((member) => member.name !== 'Aysel') });

    expect(root().querySelectorAll('.sk-member-panel')).toHaveLength(0);
    expect(ui().queryByText('Aysel')).not.toBeInTheDocument();
  });

  it('shows the new role after the host changes it', () => {
    const config = arena();
    const data = { ...createMockData(config, { viewerRole: 'leader' }), screen: 'members', open: true };
    const { handle, ui } = mount(config, data);
    fireEvent.click(rowOf(ui, 'Aysel'));

    handle.update(config, { ...data, members: data.members.map((member) => (member.name === 'Aysel' ? { ...member, role: 'elder' } : member)) });

    expect(rowOf(ui, 'Aysel')).toHaveAttribute('aria-expanded', 'true');
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

  it('names the clan owner after the top role on the home screen', () => {
    const config = arena();
    config.clan.roles = [role('member'), role('founder')];
    const { ui } = mount(config, { ...createMockData(config), screen: 'home', open: true });

    fireEvent.click(ui().getByRole('button', { name: 'Show clan info' }));

    expect(ui().getByText('Founder Murad · created Nov 2, 2026')).toBeInTheDocument();
  });
});
