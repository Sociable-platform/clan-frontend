import { useState } from 'react';

import { FONT_LIST } from '../config/widgetOptions';

export const FONT_ROLES = { HEADING: 'heading', BODY: 'body' };
export const ALL_FONTS = 'All';

/** Which font role is being picked for, the search text, the category filter and the fonts that match. */
export function useFontPicker() {
  const [role, setRole] = useState(FONT_ROLES.HEADING);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_FONTS);

  const needle = query.trim().toLowerCase();
  const fonts = FONT_LIST.filter(
    (font) =>
      (category === ALL_FONTS || font.category === category) &&
      (needle === '' || font.family.toLowerCase().includes(needle) || font.category.toLowerCase().includes(needle)),
  );

  return { role, query, category, fonts, handleRoleChange: setRole, handleQueryChange: setQuery, handleCategoryChange: setCategory };
}
