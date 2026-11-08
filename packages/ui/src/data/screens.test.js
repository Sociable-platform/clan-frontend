import { describe, expect, it } from 'vitest';

import { loadExample } from '../testUtils.js';
import { allowedBadges, badgeFor } from './badges.js';
import { countLabel, formatDate, initialsOf } from './format.js';
import { enabledTabs, resolveScreen } from './screens.js';

describe('resolveScreen', () => {
  const arena = loadExample('valid/arena.json');

  it.each([
    ['discover', false, 'discover'],
    ['create', false, 'create'],
    ['home', true, 'home'],
    ['members', true, 'members'],
    ['home', false, 'discover'],
    ['discover', true, 'discover'],
    ['create', true, 'home'],
    [undefined, true, 'home'],
    [undefined, false, 'discover'],
  ])('shows %s for inClan=%s as %s', (requested, isInClan, expected) => {
    expect(resolveScreen(arena, requested, isInClan)).toBe(expected);
  });

  it('skips a screen the config turns off, and returns null when none is left', () => {
    const config = loadExample('valid/arena.json');
    config.clan.screens.create.enabled = false;

    expect(resolveScreen(config, 'create', false)).toBe('discover');

    config.clan.screens.discover.enabled = false;

    expect(resolveScreen(config, 'create', false)).toBeNull();
  });
});

describe('enabledTabs', () => {
  it('follows the feature switches and needs a chat mode for the chat tab', () => {
    const config = loadExample('valid/arena.json');

    expect(enabledTabs(config)).toEqual(['friends', 'clan', 'chat']);

    config.friends.enabled = false;
    config.chat.directMessages = false;
    config.chat.clanChat = false;

    expect(enabledTabs(config)).toEqual(['clan']);
  });
});

describe('badges', () => {
  it('keeps the allowed badges in the config order', () => {
    const config = loadExample('valid/arena.json');
    config.clan.badges.allowed = ['moon', 'star'];

    expect(allowedBadges(config).map((badge) => badge.id)).toEqual(['moon', 'star']);
  });

  it('falls back to the first allowed badge, then to a neutral tag with the initial', () => {
    const config = loadExample('valid/arena.json');
    config.clan.badges.allowed = ['moon'];

    expect(badgeFor(config, 'star').id).toBe('moon');

    config.clan.badges.allowed = [];

    expect(badgeFor(config, 'star', 'N')).toMatchObject({ id: 'none', glyph: 'N' });
  });
});

describe('format', () => {
  it('formats dates, initials and counts', () => {
    expect(formatDate('2026-11-02')).toBe('Nov 2, 2026');
    expect(formatDate('nope')).toBe('');
    expect(initialsOf(' cara')).toBe('CA');
    expect(countLabel(40, 30)).toBe('30 / 30');
  });
});
