import { FEATURES, HERO, HOME_SECTIONS, NUMBERS, STEPS } from './homeContent';

/**
 * The landing page: what the product is, how it works in three steps, and what it includes.
 * It is public, so it has no data of its own and makes no requests.
 */
export function HomePage() {
  return (
    <div className="home">
      <section aria-labelledby="home-title" className="home-hero">
        <p className="home-eyebrow">{HERO.eyebrow}</p>
        <h1 id="home-title" className="home-title">
          {HERO.titleStart} <span className="home-title-mark">{HERO.titleMarked}</span>
        </h1>
        <p className="home-lead">{HERO.lead}</p>
      </section>

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
