import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/" className="app-brand">
          Clan Dashboard
        </Link>
        <nav aria-label="Main">
          <NavLink to="/" end className="app-nav-link">
            Home
          </NavLink>
        </nav>
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
