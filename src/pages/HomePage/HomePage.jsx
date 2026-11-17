import { ANNOUNCEMENT, FEATURES, HERO, HOME_SECTIONS, NUMBERS, STEPS } from './homeContent';
import archiveArt from '@/shared/assets/brand/xsolla-archive-sol.webp';
import { TopSlot } from '@/shared/ui/AppLayout';

import { HomeDemo } from './HomeDemo';
import { HomeHeaderControls } from './HomeHeaderControls';

/**
 * The landing page: what the product is, how it works in three steps, and what it includes.
 * It is public, so it has no data of its own and makes no requests. Its links and buttons go into
 * the app header (HomeHeaderControls).
 */
export function HomePage() {
  return (
    <div className="home">
      <HomeHeaderControls />
      {ANNOUNCEMENT ? (
        <TopSlot>
          <p className="home-strip">
            <strong>{ANNOUNCEMENT.label}:</strong> {ANNOUNCEMENT.text}
          </p>
        </TopSlot>
      ) : null}
      <section aria-labelledby="home-title" className="home-hero">
        <p className="home-eyebrow">{HERO.eyebrow}</p>
        <h1 id="home-title" className="home-title">
          {HERO.titleStart} <span className="home-title-mark">{HERO.titleMarked}</span>
        </h1>
        <p className="home-lead">{HERO.lead}</p>
      </section>

      <HomeDemo />

      <section id={HOME_SECTIONS.steps} aria-labelledby="home-steps-title" className="home-section">
        <h2 id="home-steps-title" className="home-heading">
          Three steps to social.
        </h2>
        <p className="home-sub">From sign-up to players in clans, without building or running a backend.</p>
        <ol className="home-steps">
          {STEPS.map((step, index) => (
            <li key={step.id} className="home-step">
              <p className="home-eyebrow">Step {String(index + 1).padStart(2, '0')}</p>
              <h3 className="home-step-title">{step.title}</h3>
              <p className="home-text">{step.text}</p>
              {step.snippet ? (
                <pre className="home-snippet">
                  <code>{step.snippet}</code>
                </pre>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section id={HOME_SECTIONS.features} aria-labelledby="home-features-title" className="home-section home-band">
        <h2 id="home-features-title" className="home-heading">
          Everything a clan needs.
        </h2>
        <p className="home-sub">One widget for players, one dashboard for you.</p>
        <ul className="home-features">
          {FEATURES.map((feature) => (
            <li key={feature.id} className="home-feature">
              <h3 className="home-feature-title">{feature.title}</h3>
              <p className="home-text">{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-showcase-title" className="home-section home-showcase">
        <div className="home-showcase-copy">
          <p className="home-eyebrow">Built to be left alone</p>
          <h2 id="home-showcase-title" className="home-showcase-title">
            You build the game. We keep the social side running.
          </h2>
          <p className="home-text">
            Clans, friends and chat run on our servers. Your team changes how they look and behave from the
            dashboard, and never has to ship a game update for it.
          </p>
        </div>
        {/* Xsolla brand artwork, shown as supplied: not cropped, recoloured or drawn over. */}
        <img
          className="home-showcase-art"
          src={archiveArt}
          width="960"
          height="762"
          loading="lazy"
          decoding="async"
          alt="A small robot standing beside a robotic arm and a glass display case in a bright room"
        />
      </section>

      <section aria-label="In numbers" className="home-section">
        <dl className="home-numbers">
          {NUMBERS.map((number) => (
            <div key={number.id} className="home-number">
              <dt className="home-number-label">{number.label}</dt>
              <dd className="home-number-value">{number.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
