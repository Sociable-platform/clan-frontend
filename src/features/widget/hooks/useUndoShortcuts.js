import { useEffect, useRef } from 'react';

/** Inputs that hold no text: the browser has nothing of its own to undo there. */
const NON_TEXT_INPUT_TYPES = ['button', 'checkbox', 'color', 'file', 'radio', 'range', 'reset', 'submit'];

/**
 * True when the key was pressed in a box the person types text in. There Ctrl+Z belongs to the
 * browser: it takes back the last typed characters, as in any text field.
 */
function isTypingInText(event) {
  // Inside the widget preview the real target is in a shadow tree: composedPath has it.
  const target = event.composedPath?.()[0] ?? event.target;
  if (!(target instanceof Element)) return false;
  if (target.closest('textarea, [contenteditable="true"]')) return true;
  const input = target.closest('input');
  return input !== null && !NON_TEXT_INPUT_TYPES.includes(input.type);
}

/**
 * Ctrl+Z (Cmd+Z on a Mac) calls `onUndo`; Ctrl+Shift+Z and Ctrl+Y call `onRedo`. The shortcuts work
 * anywhere on the page except while typing in a text box, where the browser's own undo applies.
 * `isEnabled` false turns them off (a read-only account).
 */
export function useUndoShortcuts({ onUndo, onRedo, isEnabled = true }) {
  const handlers = useRef({ onUndo, onRedo });
  handlers.current = { onUndo, onRedo };

  useEffect(() => {
    if (!isEnabled) return undefined;

    const handleKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      const isUndo = key === 'z' && !event.shiftKey;
      const isRedo = (key === 'z' && event.shiftKey) || key === 'y';
      if ((!isUndo && !isRedo) || isTypingInText(event)) return;

      event.preventDefault();
      if (isUndo) handlers.current.onUndo();
      else handlers.current.onRedo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled]);
}
