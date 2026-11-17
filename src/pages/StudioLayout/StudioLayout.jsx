import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { StudioSidebar } from './StudioSidebar';

/**
 * The frame of the signed-in pages about your games (the games list, invitations, a game's team
 * and API keys): a sidebar beside the page, instead of the app header and footer. `banner`
 * (optional) is shown above the page, for a notice that applies to the whole dashboard. The
 * widget editor is not in this frame: it needs the full width.
 */
export function StudioLayout({ banner = null }) {
  return (
    <div className="studio-shell">
      <StudioSidebar />
      <div className="studio-shell-content">
        {banner}
        <main className="studio-shell-main">
          <Suspense fallback={<p role="status">Loading…</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
