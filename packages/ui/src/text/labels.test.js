import { describe, expect, it } from 'vitest';

import { buildLabels } from './labels.js';

describe('buildLabels', () => {
  it('returns the built-in texts with the default word for clan', () => {
    const labels = buildLabels({});

    expect(labels.tabClan).toBe('Clan');
    expect(labels.createCta).toBe('+ Create a clan');
    expect(labels.searchClans).toBe('Search clans…');
    expect(labels.leaveWarn).toContain('clan chat');
  });

  it("applies the game's own word to the placeholders in defaults and overrides", () => {
    const labels = buildLabels({ texts: { terms: { clan: 'Guild', clans: 'Guilds' }, labels: { join: 'Enter the {Clan}', send: 'Go' } } });

    expect(labels.tabClan).toBe('Guild');
    expect(labels.join).toBe('Enter the Guild');
    expect(labels.send).toBe('Go');
    expect(labels.searchClans).toBe('Search guilds…');
    expect(labels.clanChatOff).toBe('Guild chat is off for this game.');
  });

  it('treats dollar patterns in a term as plain characters', () => {
    expect(buildLabels({ texts: { terms: { clan: "$& $1 $'", clans: 'x' } } }).tabClan).toBe("$& $1 $'");
  });

  it('ignores blank terms and empty or non-text overrides', () => {
    const labels = buildLabels({ texts: { terms: { clan: '  ', clans: 5 }, labels: { cancel: '', send: 42 } } });

    expect(labels.tabClan).toBe('Clan');
    expect(labels.cancel).toBe('Cancel');
    expect(labels.send).toBe('Send');
  });
});
