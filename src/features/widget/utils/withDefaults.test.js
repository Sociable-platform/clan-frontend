import { describe, expect, it } from 'vitest';

import { DEFAULT_WIDGET_CONFIG } from '../config/widgetDefaults';

import { withDefaults } from './withDefaults';

const GAME_ID = '7f3a2c10-5b8e-4d21-9a47-0c6e1b2d3f45';

describe('withDefaults', () => {
  it('returns the defaults plus the game id for an almost empty config', () => {
    expect(withDefaults({ schemaVersion: 1 }, GAME_ID)).toEqual({ ...DEFAULT_WIDGET_CONFIG, game_id: GAME_ID });
  });

  it('keeps saved values and fills only what is missing, at any depth', () => {
    const config = withDefaults({ schemaVersion: 1, clan: { maxMembers: 10 }, theme: { colors: { brand: '#2E8B57' } } }, GAME_ID);

    expect(config.clan.maxMembers).toBe(10);
    expect(config.clan.tags).toBe(true);
    expect(config.theme.colors.brand).toBe('#2E8B57');
    expect(config.theme.colors.text).toBe('#E8ECED');
  });

  it('lets a saved array or a saved game id win over the defaults', () => {
    const config = withDefaults({ game_id: 'saved-id', clan: { badges: { allowed: ['moon'] } } }, GAME_ID);

    expect(config.game_id).toBe('saved-id');
    expect(config.clan.badges.allowed).toEqual(['moon']);
  });

  it('keeps keys the editor does not know', () => {
    const config = withDefaults({ theme: { futureOption: { a: 1 } }, extra: true }, GAME_ID);

    expect(config.theme.futureOption).toEqual({ a: 1 });
    expect(config.extra).toBe(true);
  });

  it('keeps saved texture slots and labels', () => {
    const config = withDefaults(
      { theme: { textures: { panel: { asset: 'tex_grid', fit: 'tile', strength: 'subtle' } } }, texts: { labels: { send: 'Go' } } },
      GAME_ID,
    );

    expect(config.theme.textures.panel.asset).toBe('tex_grid');
    expect(config.texts.labels).toEqual({ send: 'Go' });
  });

  it('never changes the shared defaults', () => {
    const config = withDefaults({ schemaVersion: 1 }, GAME_ID);
    config.clan.maxMembers = 5;
    config.theme.textures.panel = {};

    expect(DEFAULT_WIDGET_CONFIG.clan.maxMembers).toBe(30);
    expect(DEFAULT_WIDGET_CONFIG.theme.textures).toEqual({});
  });
});
