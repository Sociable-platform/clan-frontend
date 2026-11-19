import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** The file names index.css imports from ./styles, in the order it imports them. */
export function importedStyleFiles() {
  const index = readFileSync(join(here, 'index.css'), 'utf8');
  return [...index.matchAll(/@import '\.\/styles\/([a-z-]+\.css)';/g)].map((match) => match[1]);
}

/** Every .css file in ./styles. */
export function styleFilesOnDisk() {
  return readdirSync(join(here, 'styles')).filter((name) => name.endsWith('.css'));
}

/**
 * The whole stylesheet as one text, for the tests that check it: the parts index.css imports,
 * joined in the order it imports them.
 */
export function readStyles() {
  return importedStyleFiles()
    .map((name) => readFileSync(join(here, 'styles', name), 'utf8'))
    .join('\n');
}
