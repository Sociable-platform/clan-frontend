import { useEffect, useId, useRef } from 'react';

import { useFontPicker } from '../../hooks/useFontPicker';

const ROW_SELECTOR = '.font-row';

/**
 * One font setting as a dropdown: a line with the setting's name and the current font, written in
 * that font. Opening it shows the search and the list; choosing a font closes it. Each font's
 * category is written beside it and the search matches it too, so "pixel" lists the pixel fonts.
 *
 * Keyboard: the search box has focus when it opens. Arrow down goes from the search into the list,
 * arrow up and down move through it (up from the first font goes back to the search), Enter chooses,
 * and Escape closes and gives focus back to the line. A click outside closes it too.
 *
 * The caller owns `isOpen`, so opening one dropdown can close another. The list opens in the flow of
 * the page, under its line, so it is never cut off by the edge of the panel it is in.
 */
export function FontDropdown({ label, value, onValueChange, isOpen, onOpenChange }) {
  const picker = useFontPicker();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const panelId = useId();

  const close = ({ returnFocus = true } = {}) => {
    onOpenChange(false);
    picker.reset();
    if (returnFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    searchRef.current?.focus();
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) close({ returnFocus: false });
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
    // `close` only uses refs and state setters, so listening again when it changes is not needed.
  }, [isOpen]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const rows = [...(rootRef.current?.querySelectorAll(ROW_SELECTOR) ?? [])];
    const index = rows.indexOf(document.activeElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    // From the search box only arrow down does something: it enters the list.
    if (index === -1 && step === -1) return;
    event.preventDefault();
    const next = index + step;
    if (next < 0) searchRef.current?.focus();
    else rows[Math.min(next, rows.length - 1)]?.focus();
  };

  const handleChoose = (family) => {
    onValueChange(family);
    close();
  };

  return (
    <div ref={rootRef} className="font-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className="font-dropdown-trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => (isOpen ? close() : onOpenChange(true))}
      >
        <span className="font-dropdown-label">{label}</span>
        <span className="font-dropdown-value" style={{ fontFamily: `'${value}', sans-serif` }}>
          {value}
        </span>
        <span aria-hidden="true" className="font-dropdown-chevron" />
      </button>
      {isOpen ? (
        // Arrow keys and Escape are handled once here for the search box and every row.
        <div id={panelId} className="font-dropdown-panel" onKeyDown={handleKeyDown}>
          <input
            ref={searchRef}
            type="search"
            className="field-input"
            aria-label={`Search fonts for ${label.toLowerCase()}`}
            placeholder="Search by name or style: Orbitron, pixel, fantasy…"
            value={picker.query}
            onChange={(event) => picker.handleQueryChange(event.target.value)}
          />
          <p role="status" className="form-group-description">
            {picker.fonts.length === 0 ? 'No font matches that search.' : `${picker.fonts.length} fonts`}
          </p>
          <ul className="font-list" aria-label={`Fonts for ${label.toLowerCase()}`}>
            {picker.fonts.map((font) => (
              <li key={font.family}>
                <button
                  type="button"
                  className="font-row"
                  aria-pressed={value === font.family}
                  onClick={() => handleChoose(font.family)}
                >
                  <span>{font.family}</span>
                  <span className="font-row-category">{font.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
