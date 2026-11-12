import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { useAuthStore } from '@/store';

// jsdom lacks these; Radix menus and popovers use them to position and to handle the pointer.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  useAuthStore.setState(useAuthStore.getInitialState(), true);
});
