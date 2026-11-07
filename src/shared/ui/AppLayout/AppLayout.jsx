import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { ROUTES } from '@/shared/config';

/** `actions` is the right-hand header slot (account controls); the layout knows nothing about auth. */
export function AppLayout({ actions = null }) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to={ROUTES.home} className="app-brand">
          Clan Dashboard
        </Link>
        <nav aria-label="Main">
          <NavLink to={ROUTES.home} end className="app-nav-link">
            Home
          </NavLink>
          <NavLink to={ROUTES.games} className="app-nav-link">
            Games
          </NavLink>
        </nav>
        {actions}
      </header>
      <main className="app-main">
        <Suspense fallback={<p role="status">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="app-footer">Clan platform · developer dashboard</footer>
    </div>
  );
}
