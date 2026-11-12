import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { createQueryClient } from '@/shared/api';

/**
 * Renders `routes` in a memory router at `initialEntries`, inside a fresh query cache
 * (no retries, so a failing request shows its error state straight away).
 * Returns the router for assertions.
 */
export function renderWithRouter(routes, { initialEntries = ['/'] } = {}) {
  const router = createMemoryRouter(routes, { initialEntries });
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 0 }, mutations: { retry: 0 } });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}
