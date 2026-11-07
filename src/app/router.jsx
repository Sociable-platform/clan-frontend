import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { AppLayout } from '@/shared/ui/AppLayout';

// Every page is code-split. Named exports need the `.then` adapter for lazy().
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
