import { Link } from 'react-router-dom';

import { PRODUCT_NAME, ROUTES, SUPPORT_EMAIL } from '@/shared/config';
import { CopyButton } from '@/shared/ui/CopyButton';

/**
 * The support page: where to write, what to put in the message so we can help on the first reply,
 * and the guide pages worth reading first. It is public and makes no requests.
 */
export function SupportPage() {
  return (
    <section aria-labelledby="support-title" className="support">
      <h1 id="support-title">Support</h1>
      <p className="support-lead">
        Something not working, or a question about {PRODUCT_NAME}? Write to us and a person on the team will answer.
      </p>

      <div className="card support-contact">
        <p className="item-meta">Email</p>
        <p className="support-email">
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          <CopyButton value={SUPPORT_EMAIL} label="Copy address" className="button-compact" />
        </p>
      </div>

      <h2 className="support-heading">What to include</h2>
      <ul className="support-list">
        <li>
          Your <strong>game ID</strong> (on the <Link to={ROUTES.games}>games page</Link>, under the game&apos;s name).
        </li>
        <li>What you did, what you expected, and what happened instead.</li>
        <li>The exact error text, or a screenshot, and roughly when it happened.</li>
        <li>For a widget problem: the address of the page it is embedded in.</li>
      </ul>
      <p className="support-note">
        <strong>Never send an API key or a player token</strong>, in an email or a screenshot. We do not need them
        to help you. If a key was shared by mistake, revoke it on the games page and create a new one.
      </p>

      <h2 className="support-heading">Before you write</h2>
      <p>
        Many problems are answered in the guide: see{' '}
        <Link to={ROUTES.docsPage('troubleshooting')}>Troubleshooting</Link> for errors and what they mean, or start
        from the <Link to={ROUTES.docsPage('quickstart')}>Quickstart</Link>.
      </p>
    </section>
  );
}
