import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { useSessionInitializer } from '@/features/auth';
import { queryClient } from '@/shared/api';

import { router } from './router';
import { useClearCacheOnSignOut } from './useClearCacheOnSignOut';

export function App() {
  useSessionInitializer();
  useClearCacheOnSignOut(queryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
