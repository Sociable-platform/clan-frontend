import { describe, expect, it } from 'vitest';

import { addRole, moveRole, removeRole, reorderRole, roleIdFromName, roleNameProblem, setRolePower } from './widgetRoles';

const role = (id, extra = {}) => ({ id, name: id, canPromote: false, canKick: false, ...extra });
const ROLES = [role('member'), role('elder'), role('captain'), role('leader')];
const ids = (roles) => roles.map((entry) => entry.id);

describe('roleNameProblem', () => {
  it('accepts a plain title and rejects empty, long, tags and links', () => {
    expect(roleNameProblem('Co-leader')).toBeNull();
    expect(roleNameProblem('  ')).toMatch(/title/);
    expect(roleNameProblem('x'.repeat(21))).toMatch(/20 characters/);
    expect(roleNameProblem('<b>Boss</b>')).toMatch(/plain text/);
    expect(roleNameProblem('go https://x.ex')).toMatch(/plain text/);
    expect(roleNameProblem('www.x.example')).toMatch(/plain text/);
  });
});

describe('roleIdFromName', () => {
  it.each([
    ['Co-Leader', 'co-leader'],
    ['Grand  Elder!', 'grand-elder'],
    ['Élite Guard', 'elite-guard'],
    ['1st Squad', 'role-1st-squad'],
    ['日本語', 'role'],
  ])('makes %s into %s', (name, expected) => {
    expect(roleIdFromName(name)).toBe(expected);
  });

  it('numbers a name that is taken and stays within 24 characters and the id pattern', () => {
    expect(roleIdFromName('Elder', ['elder'])).toBe('elder-2');
    expect(roleIdFromName('Elder', ['elder', 'elder-2'])).toBe('elder-3');

    const long = roleIdFromName('a'.repeat(40));
    const next = roleIdFromName('a'.repeat(40), [long]);

    expect(long.length).toBeLessThanOrEqual(24);
    expect(next.length).toBeLessThanOrEqual(24);
    expect(next).not.toBe(long);
    expect(next).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
  });
});

describe('role list edits', () => {
  it('adds a role just below the owner role, with no powers', () => {
    const next = addRole(ROLES, ' Sergeant ');

    expect(ids(next)).toEqual(['member', 'elder', 'captain', 'sergeant', 'leader']);
    expect(next[3]).toEqual({ id: 'sergeant', name: 'Sergeant', canPromote: false, canKick: false });
  });

  it('removes a role', () => {
    expect(ids(removeRole(ROLES, 1))).toEqual(['member', 'captain', 'leader']);
  });

  it('moves a middle role up or down, but never into or out of the lowest and owner places', () => {
    expect(ids(moveRole(ROLES, 1, 1))).toEqual(['member', 'captain', 'elder', 'leader']);
    expect(ids(moveRole(ROLES, 2, -1))).toEqual(['member', 'captain', 'elder', 'leader']);
    expect(moveRole(ROLES, 2, 1)).toBe(ROLES);
    expect(moveRole(ROLES, 1, -1)).toBe(ROLES);
    expect(moveRole(ROLES, 0, 1)).toBe(ROLES);
    expect(moveRole(ROLES, 3, -1)).toBe(ROLES);
  });

  it('sets one power on one role', () => {
    const next = setRolePower(ROLES, 1, 'canKick', true);

    expect(next[1].canKick).toBe(true);
    expect(next[2].canKick).toBe(false);
    expect(ROLES[1].canKick).toBe(false);
  });
});

describe('reorderRole', () => {
  it('moves a middle role to a position and keeps the lowest and the owner role at the ends', () => {
    const five = [role('member'), role('a'), role('b'), role('c'), role('leader')];

    expect(ids(reorderRole(five, 1, 3))).toEqual(['member', 'b', 'c', 'a', 'leader']);
    expect(ids(reorderRole(five, 3, 1))).toEqual(['member', 'c', 'a', 'b', 'leader']);
  });

  it('puts a role dropped on the owner or the lowest role next to it', () => {
    const five = [role('member'), role('a'), role('b'), role('c'), role('leader')];

    expect(ids(reorderRole(five, 1, 4))).toEqual(['member', 'b', 'c', 'a', 'leader']);
    expect(ids(reorderRole(five, 3, 0))).toEqual(['member', 'c', 'a', 'b', 'leader']);
  });

  it('does not move the lowest or the owner role, or a role onto itself', () => {
    const five = [role('member'), role('a'), role('b'), role('c'), role('leader')];

    expect(reorderRole(five, 0, 2)).toBe(five);
    expect(reorderRole(five, 4, 2)).toBe(five);
    expect(reorderRole(five, 2, 2)).toBe(five);
  });
});
