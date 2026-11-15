import { Suspense, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import wordmarkPositive from '@/shared/assets/brand/xsolla-wordmark-positive.png';
import wordmarkReverse from '@/shared/assets/brand/xsolla-wordmark-reverse.png';
import { DOCS_URL, PRODUCT_NAME, ROUTES, SUPPORT_EMAIL, XSOLLA_SOCIAL_LINKS } from '@/shared/config';

import { HeaderSlotContext } from './HeaderSlot';
import { TopSlotContext } from './TopSlot';

/**
 * The app frame: the brand on the left (it links home), a slot for a page's own controls in the
 * middle (see `HeaderSlot`), and `actions` on the right: the account menu, which holds the way to
 * the games and the theme choice. Above the header is a slot for a page's full-width notice (see
 * `TopSlot`). `banner` (optional) is shown under the header on every page, for a notice that
 * applies to the whole dashboard. The layout knows nothing about auth.
 *
 * The footer has the copyright line, Docs and Contact (each only when its address is configured:
 * `VITE_DOCS_URL`, `VITE_SUPPORT_EMAIL`) and links to Xsolla's social accounts.
 */
export function AppLayout({ actions = null, banner = null }) {
  const [slotElement, setSlotElement] = useState(null);
  const [topElement, setTopElement] = useState(null);

  return (
    <div className="app-layout">
      <div ref={setTopElement} />
      <header className="app-header">
        <Link to={ROUTES.home} className="app-brand">
          {/* The wordmark alone, as the brand rules ask for on the web: the dark one in the light
              theme, the Spark Blue one in the dark theme. CSS shows only the one that fits, and a
              hidden image is not read out, so the name is announced once. */}
          <img src={wordmarkPositive} alt="Xsolla" className="app-brand-logo app-brand-logo-light" />
          <img src={wordmarkReverse} alt="Xsolla" className="app-brand-logo app-brand-logo-dark" />
          <span className="app-brand-name">{PRODUCT_NAME}</span>
        </Link>
        <div ref={setSlotElement} className="app-header-slot" />
        <div className="app-header-end">{actions}</div>
      </header>
      {banner}
      <main className="app-main">
        <HeaderSlotContext.Provider value={slotElement}>
          <TopSlotContext.Provider value={topElement}>
            <Suspense fallback={<p role="status">Loading…</p>}>
              <Outlet />
            </Suspense>
          </TopSlotContext.Provider>
        </HeaderSlotContext.Provider>
      </main>
      <footer className="app-footer">
        <p className="app-footer-copy">
          © {new Date().getFullYear()} {PRODUCT_NAME} · developer dashboard
        </p>
        {DOCS_URL || SUPPORT_EMAIL ? (
          <nav aria-label="Help" className="app-footer-links">
            {DOCS_URL ? (
              <a href={DOCS_URL} target="_blank" rel="noreferrer">
                Docs
              </a>
            ) : null}
            {SUPPORT_EMAIL ? <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a> : null}
          </nav>
        ) : null}
        <nav aria-label="Xsolla on social media" className="app-footer-social">
          {XSOLLA_SOCIAL_LINKS.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={`Xsolla on ${link.label}`}>
              {link.label}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
