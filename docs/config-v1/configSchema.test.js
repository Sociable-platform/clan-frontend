import Ajv from 'ajv/dist/2020.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const ROOT = dirname(fileURLToPath(import.meta.url));
const MAX_CONFIG_BYTES = 64 * 1024;

const readJson = (relativePath) => JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
const clone = (value) => structuredClone(value);

describe('experience config v1 schema', () => {
  let validate;
  let manifest;
  let arena;

  const errorsOf = (config) => {
    validate(config);
    return (validate.errors ?? []).map((error) => ({ path: error.instancePath, rule: error.keyword }));
  };

  beforeAll(() => {
    const ajv = new Ajv({ allErrors: true, strict: true });
    validate = ajv.compile(readJson('config.v1.schema.json'));
    manifest = readJson('examples/manifest.json');
    arena = readJson('examples/valid/arena.json');
  });

  describe('shared fixtures', () => {
    it('matches every row of the manifest', () => {
      manifest.cases.forEach(({ file, valid, errors = [] }) => {
        const reported = errorsOf(readJson(`examples/${file}`));

        expect({ file, valid: reported.length === 0 }).toEqual({ file, valid });
        errors.forEach((expected) => expect({ file, reported }).toEqual({ file, reported: expect.arrayContaining([expected]) }));
      });
    });

    it('keeps the committed valid examples under the size limit', () => {
      manifest.cases
        .filter((row) => row.valid)
        .forEach(({ file }) => {
          const bytes = Buffer.byteLength(readFileSync(join(ROOT, 'examples', file), 'utf8'), 'utf8');
          expect(bytes).toBeLessThan(MAX_CONFIG_BYTES);
        });
    });
  });

  describe('rejections', () => {
    it('rejects an unknown field at any depth', () => {
      const topLevel = { ...clone(arena), customCss: 'body{}' };
      const nested = clone(arena);
      nested.theme.frame.glow = true;

      expect(errorsOf(topLevel)).toContainEqual({ path: '', rule: 'additionalProperties' });
      expect(errorsOf(nested)).toContainEqual({ path: '/theme/frame', rule: 'additionalProperties' });
    });

    it('rejects a wrong schemaVersion', () => {
      expect(errorsOf({ ...clone(arena), schemaVersion: 2 })).toContainEqual({ path: '/schemaVersion', rule: 'const' });
    });

    it('rejects a game_id that is not a UUID', () => {
      expect(errorsOf({ ...clone(arena), game_id: 'game_arena_7f3a' })).toContainEqual({ path: '/game_id', rule: 'pattern' });
    });

    it('rejects lowercase and short hex colors', () => {
      const lower = clone(arena);
      lower.theme.colors.brand = '#80eaff';
      const short = clone(arena);
      short.theme.frame.color = '#FFF';

      expect(errorsOf(lower)).toContainEqual({ path: '/theme/colors/brand', rule: 'pattern' });
      expect(errorsOf(short)).toContainEqual({ path: '/theme/frame/color', rule: 'pattern' });
    });

    it('rejects a font outside the curated list', () => {
      const config = clone(arena);
      config.theme.fonts.body.family = 'Comic Sans MS';

      expect(errorsOf(config)).toContainEqual({ path: '/theme/fonts/body/family', rule: 'enum' });
    });

    it('rejects a texture that is a URL instead of a built-in id', () => {
      const config = clone(arena);
      config.theme.textures.panel.asset = 'https://example.com/tex.png';

      expect(errorsOf(config)).toContainEqual({ path: '/theme/textures/panel/asset', rule: 'enum' });
    });

    it.each([
      ['an uppercase letter', 'custom-Dragon'],
      ['a space', 'custom-fire ball'],
      ['an underscore', 'custom_dragon'],
      ['a URL', 'https://cdn.example/dragon.png'],
      ['a path', '../dragon.png'],
      ['a trailing dash', 'custom-dragon-'],
      ['the bare prefix', 'custom-'],
      ['more than 32 characters', `custom-${'a'.repeat(26)}`],
    ])('rejects a custom asset name with %s', (_name, id) => {
      const badge = clone(arena);
      badge.clan.badges.allowed = [id];
      const texture = clone(arena);
      texture.theme.textures.panel.asset = id;

      expect(errorsOf(badge)).toContainEqual({ path: '/clan/badges/allowed/0', rule: 'anyOf' });
      expect(errorsOf(texture)).toContainEqual({ path: '/theme/textures/panel/asset', rule: 'anyOf' });
    });

    it('accepts custom asset names next to built-in ones, up to 12 badges', () => {
      const config = clone(arena);
      config.clan.badges.allowed = ['star', 'custom-dragon', 'custom-a1-b2'];
      config.theme.textures.content = { asset: 'custom-metal', fit: 'tile', strength: 'subtle' };

      expect(errorsOf(config)).toEqual([]);

      config.clan.badges.allowed = Array.from({ length: 12 }, (_, index) => `custom-badge-${index}`);

      expect(errorsOf(config)).toEqual([]);

      config.clan.badges.allowed.push('custom-badge-12');

      expect(errorsOf(config)).toContainEqual({ path: '/clan/badges/allowed', rule: 'maxItems' });
    });

    describe('clan roles', () => {
      const role = (id, extra = {}) => ({ id, name: id, canPromote: false, canKick: false, ...extra });
      const withRoles = (roles) => {
        const config = clone(arena);
        config.clan.roles = roles;
        return errorsOf(config);
      };

      it('accepts 2 to 12 roles, including the arena set', () => {
        expect(withRoles([role('member'), role('leader')])).toEqual([]);
        expect(withRoles(Array.from({ length: 12 }, (_, index) => role(`rank-${index}`)))).toEqual([]);
        expect(errorsOf(arena)).toEqual([]);
      });

      it('rejects fewer than 2 and more than 12', () => {
        expect(withRoles([role('member')])).toContainEqual({ path: '/clan/roles', rule: 'minItems' });
        expect(withRoles(Array.from({ length: 13 }, (_, index) => role(`rank-${index}`)))).toContainEqual({ path: '/clan/roles', rule: 'maxItems' });
      });

      it('requires roles in the clan section', () => {
        const config = clone(arena);
        delete config.clan.roles;

        expect(errorsOf(config)).toContainEqual({ path: '/clan', rule: 'required' });
      });

      it.each([
        ['an uppercase letter', 'Leader'],
        ['a leading digit', '1st'],
        ['an underscore', 'co_leader'],
        ['a trailing dash', 'leader-'],
        ['a space', 'co leader'],
        ['more than 24 characters', 'a'.repeat(25)],
      ])('rejects a role id with %s', (_name, id) => {
        expect(withRoles([role(id), role('leader')]).map((error) => error.path)).toContain('/clan/roles/0/id');
      });

      it.each([
        ['an HTML tag', '<b>Boss</b>'],
        ['a URL', 'see https://x.example'],
        ['an empty string', ''],
        ['more than 20 characters', 'x'.repeat(21)],
      ])('rejects a role title with %s', (_name, name) => {
        expect(withRoles([role('member', { name }), role('leader')]).map((error) => error.path)).toContain('/clan/roles/0/name');
      });

      it('rejects a missing power flag and a field it does not know', () => {
        const noKick = { id: 'member', name: 'Member', canPromote: false };

        expect(withRoles([noKick, role('leader')])).toContainEqual({ path: '/clan/roles/0', rule: 'required' });
        expect(withRoles([role('member', { rank: 1 }), role('leader')])).toContainEqual({ path: '/clan/roles/0', rule: 'additionalProperties' });
      });
    });

    it('rejects an unknown or duplicated badge icon', () => {
      const unknown = clone(arena);
      unknown.clan.badges.allowed = ['star', 'skull'];
      const duplicate = clone(arena);
      duplicate.clan.badges.allowed = ['star', 'star'];

      expect(errorsOf(unknown)).toContainEqual({ path: '/clan/badges/allowed/1', rule: 'enum' });
      expect(errorsOf(duplicate)).toContainEqual({ path: '/clan/badges/allowed', rule: 'uniqueItems' });
    });

    it.each([
      ['a URL with a scheme', 'See https://evil.example'],
      ['a protocol-relative URL', 'Go //evil.example'],
      ['a www host', 'Visit www.evil.example'],
      ['an HTML tag', '<img src=x>'],
      ['an empty string', ''],
      ['more than 40 characters', 'x'.repeat(41)],
    ])('rejects a label with %s', (_name, text) => {
      const config = clone(arena);
      config.texts.labels.panelTitle = text;

      expect(errorsOf(config).filter((error) => error.path === '/texts/labels/panelTitle')).not.toHaveLength(0);
    });

    it('rejects a label key that is not part of the contract', () => {
      const config = clone(arena);
      config.texts.labels.footerLink = 'Docs';

      expect(errorsOf(config)).toContainEqual({ path: '/texts/labels', rule: 'additionalProperties' });
    });

    it('rejects a config where friends, clan and chat are all disabled', () => {
      const config = clone(arena);
      config.friends.enabled = false;
      config.clan.enabled = false;
      config.chat.enabled = false;

      expect(errorsOf(config)).toContainEqual({ path: '', rule: 'anyOf' });
    });
  });

  describe('limits', () => {
    it.each([
      ['/clan/maxMembers', (c, v) => (c.clan.maxMembers = v), 1, 201, 2, 200],
      ['/clan/descriptionMax', (c, v) => (c.clan.descriptionMax = v), 19, 301, 20, 300],
      ['/chat/maxMessageLength', (c, v) => (c.chat.maxMessageLength = v), 19, 1001, 20, 1000],
      ['/chat/slowModeSeconds', (c, v) => (c.chat.slowModeSeconds = v), -1, 31, 0, 30],
      ['/chat/historyLimit', (c, v) => (c.chat.historyLimit = v), 0, 51, 1, 50],
      ['/theme/frame/width', (c, v) => (c.theme.frame.width = v), 0, 9, 1, 8],
      ['/theme/panel/opacity', (c, v) => (c.theme.panel.opacity = v), 0.49, 1.01, 0.5, 1],
    ])('%s accepts the bounds and rejects values just outside', (path, set, belowMin, aboveMax, min, max) => {
      const withValue = (value) => {
        const config = clone(arena);
        set(config, value);
        return errorsOf(config);
      };

      expect(withValue(min)).toEqual([]);
      expect(withValue(max)).toEqual([]);
      expect(withValue(belowMin).map((error) => error.path)).toContain(path);
      expect(withValue(aboveMax).map((error) => error.path)).toContain(path);
    });
  });
});
