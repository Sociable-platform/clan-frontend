import { describe, expect, it } from 'vitest';

import { getIn, isAtOrBelow, removeIn, setIn, toSegments } from './configPath';

const CONFIG = { clan: { maxMembers: 30, badges: { allowed: ['star', 'moon'] } }, 'a/b': { 'c~d': 1 } };

describe('configPath', () => {
  it('splits a pointer and unescapes ~1 and ~0', () => {
    expect(toSegments('')).toEqual([]);
    expect(toSegments('/clan/maxMembers')).toEqual(['clan', 'maxMembers']);
    expect(toSegments('/a~1b/c~0d')).toEqual(['a/b', 'c~d']);
  });

  it('reads nested values and array items, and undefined for a missing path', () => {
    expect(getIn(CONFIG, '/clan/maxMembers')).toBe(30);
    expect(getIn(CONFIG, '/clan/badges/allowed/1')).toBe('moon');
    expect(getIn(CONFIG, '/a~1b/c~0d')).toBe(1);
    expect(getIn(CONFIG, '/clan/nope/deeper')).toBeUndefined();
    expect(getIn(CONFIG, '')).toBe(CONFIG);
  });

  it('sets a value without changing the original and creates missing objects', () => {
    const next = setIn(CONFIG, '/clan/maxMembers', 10);
    const created = setIn(CONFIG, '/theme/textures/panel', { asset: 'tex_grid' });

    expect(next.clan.maxMembers).toBe(10);
    expect(CONFIG.clan.maxMembers).toBe(30);
    expect(next.clan.badges).toBe(CONFIG.clan.badges);
    expect(created.theme.textures.panel).toEqual({ asset: 'tex_grid' });
  });

  it('replaces an array as a whole', () => {
    expect(setIn(CONFIG, '/clan/badges/allowed', ['cross']).clan.badges.allowed).toEqual(['cross']);
    expect(CONFIG.clan.badges.allowed).toEqual(['star', 'moon']);
  });

  it('removes a key without changing the original', () => {
    const next = removeIn(CONFIG, '/clan/maxMembers');

    expect('maxMembers' in next.clan).toBe(false);
    expect(CONFIG.clan.maxMembers).toBe(30);
  });

  it('returns the same object when there is nothing to remove', () => {
    expect(removeIn(CONFIG, '/clan/nope')).toBe(CONFIG);
    expect(removeIn(CONFIG, '/nope/deeper')).toBe(CONFIG);
  });

  it('knows when a path is at or below a pointer', () => {
    expect(isAtOrBelow('/clan/maxMembers', '/clan')).toBe(true);
    expect(isAtOrBelow('/clan', '/clan')).toBe(true);
    expect(isAtOrBelow('/clanX/a', '/clan')).toBe(false);
    expect(isAtOrBelow('/clan', '/clan/maxMembers')).toBe(false);
    expect(isAtOrBelow('', '')).toBe(true);
    expect(isAtOrBelow('/clan', '')).toBe(false);
  });
});
