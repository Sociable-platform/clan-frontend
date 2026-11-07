import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

/** Renders `routes` in a memory router at `initialEntries`. Returns the router for assertions. */
export function renderWithRouter(routes, { initialEntries = ['/'] } = {}) {
  const router = createMemoryRouter(routes, { initialEntries });
  render(<RouterProvider router={router} />);
  return router;
}
