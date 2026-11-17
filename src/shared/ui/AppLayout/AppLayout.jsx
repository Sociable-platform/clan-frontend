import { Suspense, useState } from 'react';
import { FaFacebookF, FaInstagram, FaLinkedin, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { Link, Outlet } from 'react-router-dom';

import wordmarkPositive from '@/shared/assets/brand/xsolla-wordmark-positive.png';
import wordmarkReverse from '@/shared/assets/brand/xsolla-wordmark-reverse.png';
import { DOCS_URL, PRODUCT_NAME, ROUTES, XSOLLA_SOCIAL_LINKS } from '@/shared/config';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';

import { HeaderSlotContext } from './HeaderSlot';
import { TopSlotContext } from './TopSlot';

// The icon of each social link, by the label it has in XSOLLA_SOCIAL_LINKS. The marks come from the
// react-icons package (Font Awesome brands); a link without an icon here shows its label as text.
const SOCIAL_ICONS = {
  LinkedIn: FaLinkedin,
  Facebook: FaFacebookF,
  X: FaXTwitter,
  YouTube: FaYoutube,
  Instagram: FaInstagram,
};

/**
 * The app frame: the brand on the left (it links home), a slot for a page's own controls in the
 * middle (see `HeaderSlot`), and on the right the light / dark switch followed by `actions`: the
 * account menu of whoever is signed in, which holds the way to the games. Above the header is a slot for a page's full-width notice (see
 * `TopSlot`). `banner` (optional) is shown under the header on every page, for a notice that
 * applies to the whole dashboard. The layout knows nothing about auth.
 *
 * The footer has the copyright line, Docs (the guide built into Studio, or `VITE_DOCS_URL` when
 * that is set), Support (the /support page) and icon links to Xsolla's social accounts.
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
        <div className="app-header-end">
          <ThemeToggle />
          {actions}
        </div>
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
          © {new Date().getFullYear()} {PRODUCT_NAME}
        </p>
        <nav aria-label="Help" className="app-footer-links">
          {DOCS_URL ? (
            <a href={DOCS_URL} target="_blank" rel="noreferrer">
              Docs
            </a>
          ) : (
            <Link to={ROUTES.docs}>Docs</Link>
          )}
          <Link to={ROUTES.support}>Support</Link>
        </nav>
        <nav aria-label="Xsolla on social media" className="app-footer-social">
          {XSOLLA_SOCIAL_LINKS.map((link) => {
            const SocialIcon = SOCIAL_ICONS[link.label];
            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Xsolla on ${link.label}`}
                title={`Xsolla on ${link.label}`}
              >
                {SocialIcon ? <SocialIcon aria-hidden="true" /> : link.label}
              </a>
            );
          })}
        </nav>
      </footer>
    </div>
  );
}
