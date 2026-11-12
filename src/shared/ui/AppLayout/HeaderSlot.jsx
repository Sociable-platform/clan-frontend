import { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

// The element in the header that pages put their own controls into. `undefined` means there
// is no app header around (tests, a page rendered alone); `null` means it is not mounted yet.
export const HeaderSlotContext = createContext(undefined);

/**
 * Puts `children` into the app header's slot, so a page can show its controls (the widget
 * editor's game chip, save state and config toggle) in the same bar as the brand and links.
 * Without an app header around, they render in place instead.
 */
export function HeaderSlot({ children }) {
  const slotElement = useContext(HeaderSlotContext);

  if (slotElement === undefined) return children;
  return slotElement ? createPortal(children, slotElement) : null;
}
