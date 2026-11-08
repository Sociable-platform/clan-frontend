import { describe, expect, it } from 'vitest';

import { loadExample } from '../testUtils.js';
import { abilitiesOver, hasAbilities, isTopRole, normalizeRoles, roleIndex, roleName } from './roles.js';

const role = (id, extra = {}) => ({ id, name: id, canPromote: false, canKick: false, ...extra });
const FIVE = normalizeRoles({
  clan: {
    roles: [
      role('member'),
      role('elder'),
      role('senior', { canPromote: true }),
      role('co-leader', { canPromote: true, canKick: true }),
      role('leader'),
    ],
  },
});

describe('normalizeRoles', () => {
  it('keeps the arena roles in order', () => {
    expect(normalizeRoles(loadExample('valid/arena.json')).map((entry) => entry.id)).toEqual(['member', 'elder', 'co-leader', 'leader']);
  });

  it('falls back to Member and Leader when fewer than two usable roles are left', () => {
    expect(normalizeRoles({}).map((entry) => entry.id)).toEqual(['member', 'leader']);
    expect(normalizeRoles({ clan: { roles: [role('solo')] } }).map((entry) => entry.id)).toEqual(['member', 'leader']);
    expect(normalizeRoles({ clan: { roles: 'nope' } }).map((entry) => entry.id)).toEqual(['member', 'leader']);
  });

  it('drops entries without an id and repeated ids, and names an unnamed role by its id', () => {
    const roles = normalizeRoles({ clan: { roles: [role('a'), null, { name: 'x' }, role('a'), { id: 'b', name: '  ' }] } });

    expect(roles).toEqual([
      { id: 'a', name: 'a', canPromote: false, canKick: false },
      { id: 'b', name: 'b', canPromote: false, canKick: false },
    ]);
  });
});

describe('roleIndex and roleName', () => {
  it('finds a role, and reads owner and member as the last and the first', () => {
    expect(roleIndex(FIVE, 'senior')).toBe(2);
    expect(roleIndex(FIVE, 'owner')).toBe(4);
    expect(roleIndex(FIVE, 'ghost')).toBe(-1);
    expect(roleName(FIVE, 'owner')).toBe('leader');
    expect(roleName(FIVE, 'ghost')).toBe('ghost');
    expect(isTopRole(FIVE, 'leader')).toBe(true);
    expect(isTopRole(FIVE, 'elder')).toBe(false);
  });

  it('prefers a real role id over the legacy words', () => {
    const roles = normalizeRoles({ clan: { roles: [role('rookie'), role('member'), role('owner')] } });

    expect(roleIndex(roles, 'member')).toBe(1);
  });
});

describe('abilitiesOver', () => {
  const ids = (abilities) => ({ promote: abilities.promoteTo?.id ?? null, demote: abilities.demoteTo?.id ?? null, kick: abilities.canKick });

  it('lets the owner do everything to everyone below, one step at a time, never promoting into the owner role', () => {
    expect(ids(abilitiesOver(FIVE, 'leader', 'member'))).toEqual({ promote: 'elder', demote: null, kick: true });
    expect(ids(abilitiesOver(FIVE, 'leader', 'elder'))).toEqual({ promote: 'senior', demote: 'member', kick: true });
    expect(ids(abilitiesOver(FIVE, 'leader', 'co-leader'))).toEqual({ promote: null, demote: 'senior', kick: true });
  });

  it('only lets a role act on lower roles and promote to below its own', () => {
    expect(ids(abilitiesOver(FIVE, 'co-leader', 'senior'))).toEqual({ promote: null, demote: 'elder', kick: true });
    expect(ids(abilitiesOver(FIVE, 'co-leader', 'elder'))).toEqual({ promote: 'senior', demote: 'member', kick: true });
    expect(hasAbilities(abilitiesOver(FIVE, 'co-leader', 'co-leader'))).toBe(false);
    expect(hasAbilities(abilitiesOver(FIVE, 'co-leader', 'leader'))).toBe(false);
  });

  it('follows the power flags of the actor: promote without kick, none at all', () => {
    expect(ids(abilitiesOver(FIVE, 'senior', 'member'))).toEqual({ promote: 'elder', demote: null, kick: false });
    expect(hasAbilities(abilitiesOver(FIVE, 'elder', 'member'))).toBe(false);
  });

  it('offers nothing for an unknown role or yourself', () => {
    expect(hasAbilities(abilitiesOver(FIVE, 'ghost', 'member'))).toBe(false);
    expect(hasAbilities(abilitiesOver(FIVE, 'leader', 'ghost'))).toBe(false);
    expect(hasAbilities(abilitiesOver(FIVE, 'leader', 'leader'))).toBe(false);
  });

  it('works with the two roles of the old social service (owner and member)', () => {
    const two = normalizeRoles({});

    expect(ids(abilitiesOver(two, 'owner', 'member'))).toEqual({ promote: null, demote: null, kick: true });
    expect(hasAbilities(abilitiesOver(two, 'member', 'owner'))).toBe(false);
  });
});
