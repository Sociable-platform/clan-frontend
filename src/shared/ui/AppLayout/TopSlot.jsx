import { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

// The element above the app header that a page can put a full-width notice into. `undefined`
// means there is no app frame around (tests, a page rendered alone); `null`, not mounted yet.
export const TopSlotContext = createContext(undefined);

/**
 * Puts `children` above the app header, across the whole window: the landing page's announcement
 * strip. Without an app frame around, they render in place instead.
 */
export function TopSlot({ children }) {
  const slotElement = useContext(TopSlotContext);

  if (slotElement === undefined) return children;
  return slotElement ? createPortal(children, slotElement) : null;
}
