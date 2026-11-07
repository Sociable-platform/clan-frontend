import { RouterProvider } from 'react-router-dom';

import { useSessionInitializer } from '@/features/auth';

import { router } from './router';

export function App() {
  useSessionInitializer();
  return <RouterProvider router={router} />;
}
