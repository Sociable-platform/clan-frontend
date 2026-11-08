import { useCallback, useState } from 'react';

import { applyTheme, getAppliedTheme, storeTheme } from './theme';

/** The theme on screen and a function to change it (applies it and remembers it). */
export function useTheme() {
  const [theme, setTheme] = useState(getAppliedTheme);

  const selectTheme = useCallback((next) => {
    applyTheme(next);
    storeTheme(next);
    setTheme(next);
  }, []);

  return { theme, selectTheme };
}
