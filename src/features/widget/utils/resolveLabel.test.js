import { describe, expect, it } from 'vitest';

import { resolveLabel } from './resolveLabel';

describe('resolveLabel', () => {
  it('fills the four placeholders with the clan words', () => {
    const terms = { clan: 'Guild', clans: 'Guilds' };

    expect(resolveLabel('+ Create a {clan}', terms)).toBe('+ Create a guild');
    expect(resolveLabel('{Clan} chat is off for this game.', terms)).toBe('Guild chat is off for this game.');
    expect(resolveLabel('Search {clans}…', terms)).toBe('Search guilds…');
    expect(resolveLabel('{Clans}', terms)).toBe('Guilds');
  });

  it('falls back to Clan and Clans when a term is blank', () => {
    expect(resolveLabel('Leave {clan}', { clan: '  ', clans: '' })).toBe('Leave clan');
  });
});
