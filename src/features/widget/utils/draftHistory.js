/**
 * The undo and redo steps of one editing session: earlier versions of the draft, kept in memory
 * only. A reload starts with an empty history; the draft itself is saved by autosave as always.
 */

/** How many steps back Undo can go. Older steps fall off the end. */
export const HISTORY_LIMIT = 50;

/** Edits of the same field this close together (typing, repeated + clicks) are one step. */
export const HISTORY_COALESCE_MS = 800;

/** Edits this close together come from one action that changed several fields: one step. */
const SAME_ACTION_MS = 10;

/**
 * `record(previous, pointer)` before every edit, with the draft as it was and the field that
 * changes. `undo(current)` and `redo(current)` return the draft to show, or null when there is
 * nothing to go to; `current` is the draft on screen, kept for the way back.
 */
export function createDraftHistory({ limit = HISTORY_LIMIT, coalesceMs = HISTORY_COALESCE_MS, now = Date.now } = {}) {
  let past = [];
  let future = [];
  // The last recorded edit: an edit that continues it adds no step.
  let last = null;

  return {
    record(previous, pointer) {
      const at = now();
      const continues =
        last !== null && ((last.pointer === pointer && at - last.at <= coalesceMs) || at - last.at <= SAME_ACTION_MS);
      last = { pointer, at };
      // A new edit after an undo starts a new line of history: the undone steps are gone.
      future = [];
      if (!continues) past = [...past, previous].slice(-limit);
    },

    undo(current) {
      if (past.length === 0) return null;
      const previous = past.at(-1);
      past = past.slice(0, -1);
      future = [...future, current];
      last = null;
      return previous;
    },

    redo(current) {
      if (future.length === 0) return null;
      const next = future.at(-1);
      future = future.slice(0, -1);
      past = [...past, current].slice(-limit);
      last = null;
      return next;
    },

    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
}
