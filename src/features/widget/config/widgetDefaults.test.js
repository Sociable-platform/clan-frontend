import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import { withDefaults } from '../utils/withDefaults';

const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../../../docs/config-v1/config.v1.schema.json');

describe('DEFAULT_WIDGET_CONFIG', () => {
  it('is a valid config v1 once it has a game id, so a new draft can be saved as it is', () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')));

    const config = withDefaults({ schemaVersion: 1 }, '7f3a2c10-5b8e-4d21-9a47-0c6e1b2d3f45');

    expect(validate(config)).toBe(true);
    expect(validate.errors).toBeNull();
  });
});
