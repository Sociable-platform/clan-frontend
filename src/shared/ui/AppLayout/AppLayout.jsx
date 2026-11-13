import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { ROUTES } from '@/shared/config';

import { HeaderSlotContext } from './HeaderSlot';

/**
 * The app frame: the brand and links on the left, a slot for a page's own controls in the
 * middle (see `HeaderSlot`), and `actions` on the right: the account menu, which also holds the
 * theme choice. `banner` (optional) is shown under the header on every page, for a notice that
 * applies to the whole dashboard. The layout knows nothing about auth.
 */
export function AppLayout({ actions = null, banner = null }) {
  const [slotElement, setSlotElement] = useState(null);

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to={ROUTES.home} className="app-brand">
          <span aria-hidden="true" className="app-brand-mark">
            S
          </span>
          <span className="app-brand-name">
            <strong>SocialKit</strong> Studio
          </span>
        </Link>
        <nav aria-label="Main">
          <NavLink to={ROUTES.home} end className="app-nav-link">
            Home
          </NavLink>
          <NavLink to={ROUTES.games} className="app-nav-link">
            Games
          </NavLink>
        </nav>
        <div ref={setSlotElement} className="app-header-slot" />
        <div className="app-header-end">{actions}</div>
      </header>
      {banner}
      <main className="app-main">
        <HeaderSlotContext.Provider value={slotElement}>
          <Suspense fallback={<p role="status">Loading…</p>}>
            <Outlet />
          </Suspense>
        </HeaderSlotContext.Provider>
      </main>
      <footer className="app-footer">SocialKit Studio · developer dashboard</footer>
    </div>
  );
}
