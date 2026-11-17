import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import {
  AccountControls,
  GuestOnly,
  RequireAuth,
  RequireRole,
  SuspensionBanner,
} from '@/features/auth';
import { ROUTES } from '@/shared/config';
import { AppLayout } from '@/shared/ui/AppLayout';
import { ROLES } from '@/store';

// Every page is code-split. Named exports need the `.then` adapter for lazy().
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const VerifyRegistrationPage = lazy(() =>
  import('@/pages/VerifyRegistrationPage').then((m) => ({ default: m.VerifyRegistrationPage })),
);
const GamesPage = lazy(() => import('@/pages/GamesPage').then((m) => ({ default: m.GamesPage })));
const GameRedirect = lazy(() => import('@/pages/GamesPage').then((m) => ({ default: m.GameRedirect })));
const TeamPage = lazy(() => import('@/pages/TeamPage').then((m) => ({ default: m.TeamPage })));
const InvitationsPage = lazy(() =>
  import('@/pages/InvitationsPage').then((m) => ({ default: m.InvitationsPage })),
);
const WidgetEditorPage = lazy(() =>
  import('@/pages/WidgetEditorPage').then((m) => ({ default: m.WidgetEditorPage })),
);
const AdminLoginPage = lazy(() =>
  import('@/pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })),
);
const AdminDevelopersPage = lazy(() =>
  import('@/pages/AdminDevelopersPage').then((m) => ({ default: m.AdminDevelopersPage })),
);
const AdminDeveloperDetailPage = lazy(() =>
  import('@/pages/AdminDeveloperDetailPage').then((m) => ({ default: m.AdminDeveloperDetailPage })),
);
const DocsPage = lazy(() => import('@/pages/DocsPage').then((m) => ({ default: m.DocsPage })));
const SupportPage = lazy(() => import('@/pages/SupportPage').then((m) => ({ default: m.SupportPage })));
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

export const router = createBrowserRouter([
  {
    element: <AppLayout actions={<AccountControls />} banner={<SuspensionBanner />} />,
    errorElement: <NotFoundPage />,
    children: [
      // Public shell
      { path: ROUTES.home, element: <HomePage /> },
      // The developer guide is public: a developer reads it before they have an account.
      { path: ROUTES.docs, element: <DocsPage /> },
      { path: ROUTES.docsPattern, element: <DocsPage /> },
      { path: ROUTES.support, element: <SupportPage /> },
      // A reset link must work whoever is signed in in this browser, so it is not guest-only.
      { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },
      // Guest-only shell
      {
        element: <GuestOnly />,
        children: [
          { path: ROUTES.login, element: <LoginPage /> },
          { path: ROUTES.register, element: <RegisterPage /> },
          { path: ROUTES.registerVerify, element: <VerifyRegistrationPage /> },
          { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
        ],
      },
      // Authenticated shell
      {
        element: <RequireAuth />,
        children: [
          { path: ROUTES.games, element: <GamesPage /> },
          { path: ROUTES.gamePattern, element: <GameRedirect /> },
          { path: ROUTES.widgetPattern, element: <WidgetEditorPage /> },
          { path: ROUTES.teamPattern, element: <TeamPage /> },
          { path: ROUTES.invitations, element: <InvitationsPage /> },
        ],
      },
      // Admin shell: the sign-in page is open to anyone who is not already an admin. Everything
      // else is stealth, so guests and developers get the 404 page and cannot tell /admin exists.
      {
        element: <GuestOnly role={ROLES.ADMIN} />,
        children: [{ path: ROUTES.admin.login, element: <AdminLoginPage /> }],
      },
      {
        element: <RequireRole role={ROLES.ADMIN} stealth notFound={<NotFoundPage />} />,
        children: [
          {
            path: ROUTES.admin.root,
            element: <Navigate to={ROUTES.admin.developers} replace />,
          },
          { path: ROUTES.admin.developers, element: <AdminDevelopersPage /> },
          { path: ROUTES.admin.developerPattern, element: <AdminDeveloperDetailPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
