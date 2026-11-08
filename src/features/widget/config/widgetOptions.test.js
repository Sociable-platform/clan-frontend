import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { WIDGET_LIMITS } from './widgetConfig';
import {
  BADGES,
  BUTTON_STYLES,
  CHAT_LAYOUTS,
  CORNERS,
  FONT_GROUPS,
  FRAME_STYLES,
  LABEL_GROUPS,
  NO_TEXTURE,
  POSITIONS,
  TEXTURES,
  THEME_MODES,
} from './widgetOptions';

const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../../../docs/config-v1/config.v1.schema.json');
const { $defs: defs } = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));

const values = (options) => options.map((option) => option.value);
const sorted = (list) => [...list].sort();

// The editor offers exactly what the contract allows; these tests fail the day they drift.
describe('widget options match the config v1 schema', () => {
  it('fonts', () => {
    const offered = FONT_GROUPS.flatMap((group) => values(group.options));

    expect(sorted(offered)).toEqual(sorted(defs.font.properties.family.enum));
  });

  it('choices', () => {
    expect(values(THEME_MODES)).toEqual(defs.theme.properties.mode.enum);
    expect(values(FRAME_STYLES)).toEqual(defs.theme.properties.frame.properties.style.enum);
    expect(values(CORNERS)).toEqual(defs.theme.properties.frame.properties.corners.enum);
    expect(values(BUTTON_STYLES)).toEqual(defs.theme.properties.buttons.properties.style.enum);
    expect(values(POSITIONS)).toEqual(defs.layout.properties.position.enum);
    expect(values(CHAT_LAYOUTS)).toEqual(defs.chat.properties.layout.enum);
  });

  it('textures and badges', () => {
    expect(values(TEXTURES).filter((value) => value !== NO_TEXTURE)).toEqual(defs.texture.properties.asset.anyOf[0].enum);
    expect(BADGES.map((badge) => badge.id)).toEqual(defs.clan.properties.badges.properties.allowed.items.anyOf[0].enum);
  });

  it('label keys', () => {
    const offered = LABEL_GROUPS.flatMap((group) => group.labels.map((label) => label.key));

    expect(sorted(offered)).toEqual(sorted(Object.keys(defs.texts.properties.labels.properties)));
  });

  it('numeric limits and text lengths', () => {
    const range = ({ minimum, maximum }) => ({ MIN: minimum, MAX: maximum });

    expect(WIDGET_LIMITS.MAX_MEMBERS).toEqual(range(defs.clan.properties.maxMembers));
    expect(WIDGET_LIMITS.DESCRIPTION_MAX).toEqual(range(defs.clan.properties.descriptionMax));
    expect(WIDGET_LIMITS.MESSAGE_LENGTH).toEqual(range(defs.chat.properties.maxMessageLength));
    expect(WIDGET_LIMITS.SLOW_MODE_SECONDS).toEqual(range(defs.chat.properties.slowModeSeconds));
    expect(WIDGET_LIMITS.HISTORY_LIMIT).toEqual(range(defs.chat.properties.historyLimit));
    expect(WIDGET_LIMITS.FRAME_WIDTH).toEqual(range(defs.theme.properties.frame.properties.width));
    expect(WIDGET_LIMITS.LABEL_MAX).toBe(defs.text.maxLength);
    expect(WIDGET_LIMITS.TERM_MAX).toBe(defs.term.maxLength);
    expect(WIDGET_LIMITS.CUSTOM_ASSET_ID_MAX).toBe(defs.customAssetId.maxLength);
    expect(WIDGET_LIMITS.BADGES_MAX).toBe(defs.clan.properties.badges.properties.allowed.maxItems);
    expect(WIDGET_LIMITS.ROLES).toEqual({ MIN: defs.clan.properties.roles.minItems, MAX: defs.clan.properties.roles.maxItems });
    expect(WIDGET_LIMITS.ROLE_NAME_MAX).toBe(defs.clanRole.properties.name.maxLength);
    expect(WIDGET_LIMITS.ROLE_ID_MAX).toBe(defs.clanRole.properties.id.maxLength);
    expect(WIDGET_LIMITS.PANEL_OPACITY_PERCENT).toEqual({
      MIN: defs.theme.properties.panel.properties.opacity.minimum * 100,
      MAX: defs.theme.properties.panel.properties.opacity.maximum * 100,
    });
  });
});
