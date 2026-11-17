import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';

import { SERVICE_URLS } from '@/shared/config';
import { CopyButton } from '@/shared/ui/CopyButton';

const PLACEHOLDERS = {
  '{{SDK_URL}}': SERVICE_URLS.sdk,
  '{{PLATFORM_URL}}': SERVICE_URLS.platform,
  '{{SOCIAL_URL}}': SERVICE_URLS.social,
  '{{REALTIME_URL}}': SERVICE_URLS.realtime,
};

/** Puts this deployment's addresses where the text has {{SDK_URL}} and the like. */
export function fillAddresses(markdown) {
  return Object.entries(PLACEHOLDERS).reduce((text, [key, value]) => text.replaceAll(key, value), markdown);
}

/** The text inside a rendered <pre><code>, for the copy button. */
function codeText(children) {
  const code = Array.isArray(children) ? children[0] : children;
  return String(code?.props?.children ?? '').replace(/\n$/, '');
}

const COMPONENTS = {
  // A code sample with a Copy button in its corner.
  pre({ children }) {
    return (
      <div className="docs-code">
        <pre>{children}</pre>
        <CopyButton value={codeText(children)} label="Copy" className="button-compact docs-code-copy" />
      </div>
    );
  },
  // Links inside the app stay in the app; anything else opens in a new tab.
  a({ href = '', children }) {
    if (href.startsWith('/')) return <Link to={href}>{children}</Link>;
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  },
  // A wide table scrolls in its own box instead of stretching the page on a phone.
  table({ children }) {
    return (
      <div className="docs-table">
        <table>{children}</table>
      </div>
    );
  },
};

/**
 * One guide page, from Markdown. react-markdown builds React elements and ignores raw HTML in the
 * text, so a page cannot inject markup.
 */
export function DocsMarkdown({ markdown }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
      {fillAddresses(markdown)}
    </ReactMarkdown>
  );
}
