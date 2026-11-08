import { within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createMockData } from './data/mockData.js';
import { render } from './render.js';

const EXAMPLES = join(dirname(fileURLToPath(import.meta.url)), '../../../docs/config-v1/examples');

/** One of the shared config v1 fixtures (`valid/arena.json`), a fresh copy each time. */
export const loadExample = (name) => JSON.parse(readFileSync(join(EXAMPLES, name), 'utf8'));

/** Mount the panel in the document and return queries scoped to its Shadow DOM. */
export function mount(config, data = { ...createMockData(config), open: true }) {
  const container = document.createElement('div');
  document.body.append(container);
  const handle = render(container, config, data);
  const shadow = container.firstElementChild.shadowRoot;
  const root = () => shadow.querySelector('.sk-root');
  return { container, handle, shadow, root, ui: () => within(root()) };
}
