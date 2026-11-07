import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { useAuthStore } from '@/store';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  useAuthStore.setState(useAuthStore.getInitialState(), true);
});
