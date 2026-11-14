import { useState } from 'react';

import { FONT_LIST } from '../config/widgetOptions';

export const FONT_ROLES = { HEADING: 'heading', BODY: 'body' };
export const ALL_FONTS = 'All';

/** One font list's search text and category filter, the fonts that match, and a way to start over. */
export function useFontPicker() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_FONTS);

  const needle = query.trim().toLowerCase();
  const fonts = FONT_LIST.filter(
    (font) =>
      (category === ALL_FONTS || font.category === category) &&
      (needle === '' || font.family.toLowerCase().includes(needle) || font.category.toLowerCase().includes(needle)),
  );
  const reset = () => {
    setQuery('');
    setCategory(ALL_FONTS);
  };

  return { query, category, fonts, handleQueryChange: setQuery, handleCategoryChange: setCategory, reset };
}
