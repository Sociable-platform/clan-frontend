import { useState } from 'react';

import { FONT_LIST } from '../config/widgetOptions';

export const FONT_ROLES = { HEADING: 'heading', BODY: 'body' };

/**
 * One font list's search text, the fonts that match, and a way to start over. The search looks at
 * the font's name and at its category, so "pixel" or "fantasy" finds that whole group.
 */
export function useFontPicker() {
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const fonts = FONT_LIST.filter(
    (font) =>
      needle === '' || font.family.toLowerCase().includes(needle) || font.category.toLowerCase().includes(needle),
  );
  const reset = () => setQuery('');

  return { query, fonts, handleQueryChange: setQuery, reset };
}
