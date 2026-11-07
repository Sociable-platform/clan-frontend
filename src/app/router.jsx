import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { AccountControls, GuestOnly, RequireAuth } from '@/features/auth';
import { ROUTES } from '@/shared/config';
import { AppLayout } from '@/shared/ui/AppLayout';

// Every page is code-split. Named exports need the `.then` adapter for lazy().
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ProjectsPage = lazy(() =>
  import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

export const router = createBrowserRouter([
  {
    element: <AppLayout actions={<AccountControls />} />,
    errorElement: <NotFoundPage />,
    children: [
      // Public shell
      { path: ROUTES.home, element: <HomePage /> },
      // Guest-only shell
      {
        element: <GuestOnly />,
        children: [
          { path: ROUTES.login, element: <LoginPage /> },
          { path: ROUTES.register, element: <RegisterPage /> },
        ],
      },
      // Authenticated shell
      {
        element: <RequireAuth />,
        children: [{ path: ROUTES.projects, element: <ProjectsPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
