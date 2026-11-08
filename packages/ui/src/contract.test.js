import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { BADGE_IDS } from './data/badges.js';
import { buildLabels } from './text/labels.js';
import { FONT_FAMILIES } from './theme/fonts.js';
import { TEXTURE_ASSETS } from './theme/textures.js';

const SCHEMA = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../docs/config-v1/config.v1.schema.json'), 'utf8'));
const defs = SCHEMA.$defs;

/** The panel mirrors the lists in the config v1 schema; these fail when the two drift apart. */
describe('config v1 contract', () => {
  it('knows every curated font and no other', () => {
    expect([...FONT_FAMILIES].sort()).toEqual([...defs.font.properties.family.enum].sort());
  });

  it('knows every badge icon and no other', () => {
    expect([...BADGE_IDS].sort()).toEqual([...defs.clan.properties.badges.properties.allowed.items.anyOf[0].enum].sort());
  });

  it('knows every built-in texture and no other', () => {
    expect([...TEXTURE_ASSETS].sort()).toEqual([...defs.texture.properties.asset.anyOf[0].enum].sort());
  });

  it('has a default text for every label key in the schema', () => {
    const schemaKeys = Object.keys(defs.texts.properties.labels.properties);

    expect(Object.keys(buildLabels({}))).toEqual(expect.arrayContaining(schemaKeys));
  });
});
