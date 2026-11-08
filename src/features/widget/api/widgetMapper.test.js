import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';
import { buildWidgetConfig } from '@/test/builders';

import { mapWidgetDraft } from './widgetMapper';

const GAME_ID = '7f3a2c10-5b8e-4d21-9a47-0c6e1b2d3f45';

describe('widgetMapper', () => {
  it('unwraps the saved config from the draft envelope', () => {
    const saved = buildWidgetConfig();

    const config = mapWidgetDraft({ config: saved, updatedAt: '2026-11-08T12:00:00Z' }, { gameId: GAME_ID });

    expect(config).toEqual(saved);
  });

  it('completes the server default for a game with no saved draft', () => {
    const config = mapWidgetDraft({ config: { schemaVersion: 1 }, updatedAt: null }, { gameId: GAME_ID });

    expect(config.game_id).toBe(GAME_ID);
    expect(config.theme.colors.brand).toBe('#80EAFF');
    expect(config.chat.maxMessageLength).toBe(300);
    expect(config.clan.badges.allowed).toHaveLength(6);
  });

  it.each([[null], [[]], ['text'], [{}], [{ config: null }], [{ config: [] }], [{ schemaVersion: 1 }]])(
    'rejects %j as a draft envelope',
    (raw) => {
      expect(() => mapWidgetDraft(raw, { gameId: GAME_ID })).toThrow(ApiError);
    },
  );
});
