import playerTokens from './content/player-tokens.md?raw';
import quickstart from './content/quickstart.md?raw';
import studio from './content/studio.md?raw';
import widget from './content/widget.md?raw';

/**
 * The pages of the developer guide, in the order of the side list. Each page is a Markdown file
 * in ./content; to add one, write the file and list it here. `slug` is its address (/docs/<slug>).
 * In the text, {{SDK_URL}}, {{PLATFORM_URL}}, {{SOCIAL_URL}} and {{REALTIME_URL}} are replaced
 * with this deployment's addresses, so the samples can be copied as they are.
 */
export const DOCS_PAGES = [
  { slug: 'quickstart', title: 'Quickstart', markdown: quickstart },
  { slug: 'player-tokens', title: 'Player tokens', markdown: playerTokens },
  { slug: 'widget', title: 'The widget in your page', markdown: widget },
  { slug: 'studio', title: 'Designing the widget in Studio', markdown: studio },
];

export const FIRST_DOCS_PAGE = DOCS_PAGES[0];

export function findDocsPage(slug) {
  return DOCS_PAGES.find((page) => page.slug === slug) ?? null;
}
