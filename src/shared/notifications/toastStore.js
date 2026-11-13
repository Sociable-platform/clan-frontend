import { useSyncExternalStore } from 'react';

// How long a toast stays before it goes away on its own.
export const TOAST_DURATION_MS = 5000;

export const TOAST_TONE = {
  SUCCESS: 'success',
  ERROR: 'error',
};

// A tiny store outside React so a mutation hook can raise a toast without a provider or context.
// It holds only what is on screen right now, never backend data.
let toasts = [];
let nextId = 1;
const listeners = new Set();
const timers = new Map();

function emit(next) {
  toasts = next;
  listeners.forEach((listener) => listener());
}

/** Shows `message` for a few seconds. Returns the toast's id. */
export function showToast({ message, tone = TOAST_TONE.SUCCESS }) {
  const id = nextId++;
  emit([...toasts, { id, message, tone }]);
  timers.set(
    id,
    setTimeout(() => dismissToast(id), TOAST_DURATION_MS),
  );
  return id;
}

export function dismissToast(id) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  emit(toasts.filter((toast) => toast.id !== id));
}

/** Removes every toast and its timer. Used by tests to start clean. */
export function clearToasts() {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
  emit([]);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

/** The toasts on screen now, oldest first. */
export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
