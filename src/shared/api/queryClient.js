import { QueryClient } from '@tanstack/react-query';

/**
 * Server-state cache defaults, set once here: queries retry once, mutations
 * never retry on their own (a repeated POST could create a second API key).
 * Tests build a fresh client per render with `retry: false`.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });
}

export const queryClient = createQueryClient();
