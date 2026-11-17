import { Link, Navigate, NavLink, useParams } from 'react-router-dom';

import { ROUTES } from '@/shared/config';

import { DocsMarkdown } from './DocsMarkdown';
import { DOCS_PAGES, findDocsPage, FIRST_DOCS_PAGE } from './docsPages';

/**
 * The developer guide: a list of pages beside the page that is open. It is public and makes no
 * requests; the pages are Markdown files bundled with the app (docsPages.js). /docs opens the
 * first page, and an address that names no page says so and offers the list.
 */
export function DocsPage() {
  const { slug } = useParams();

  if (!slug) return <Navigate to={ROUTES.docsPage(FIRST_DOCS_PAGE.slug)} replace />;

  const page = findDocsPage(slug);

  return (
    <div className="docs">
      <nav aria-label="Documentation" className="docs-nav">
        <p className="docs-nav-title">Developer guide</p>
        <ul className="docs-nav-list">
          {DOCS_PAGES.map((item) => (
            <li key={item.slug}>
              <NavLink to={ROUTES.docsPage(item.slug)} className="docs-nav-link">
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <article className="docs-article">
        {page ? (
          <DocsMarkdown markdown={page.markdown} />
        ) : (
          <>
            <h1>Page not found</h1>
            <p>
              There is no guide page at this address. Start with the{' '}
              <Link to={ROUTES.docsPage(FIRST_DOCS_PAGE.slug)}>{FIRST_DOCS_PAGE.title}</Link>.
            </p>
          </>
        )}
      </article>
    </div>
  );
}
