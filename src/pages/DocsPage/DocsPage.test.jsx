import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/test/renderWithRouter';

import { fillAddresses } from './DocsMarkdown';
import { DocsPage } from './DocsPage';
import { DOCS_PAGES } from './docsPages';

const ROUTE_LIST = [
  { path: '/docs', element: <DocsPage /> },
  { path: '/docs/:slug', element: <DocsPage /> },
  { path: '/games', element: <h1>Games stand-in</h1> },
];

const renderDocs = (path) => renderWithRouter(ROUTE_LIST, { initialEntries: [path] });

describe('DocsPage', () => {
  it('opens the first page at /docs', async () => {
    renderDocs('/docs');

    expect(await screen.findByRole('heading', { level: 1, name: 'Quickstart' })).toBeInTheDocument();
  });

  it('lists every page and marks the open one', async () => {
    renderDocs('/docs/quickstart');

    const nav = await screen.findByRole('navigation', { name: 'Documentation' });
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual(DOCS_PAGES.map((page) => page.title));
    expect(within(nav).getByRole('link', { name: 'Quickstart' })).toHaveAttribute('aria-current', 'page');
  });

  it('says so when the address names no page, and offers the first one', async () => {
    renderDocs('/docs/no-such-page');

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    const article = screen.getByRole('article');
    expect(within(article).getByRole('link', { name: 'Quickstart' })).toHaveAttribute('href', '/docs/quickstart');
  });

  it('shows the four steps and the request a game server makes', async () => {
    renderDocs('/docs/quickstart');

    const article = (await screen.findByRole('heading', { level: 1, name: 'Quickstart' })).closest('article');
    expect(within(article).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Before you start',
      '1. Register your game and create an API key',
      '2. Design the widget and publish it',
      '3. Add a player-token endpoint to your game server',
      '4. Add the SDK to your game\'s page',
      'Check that it works',
      'Next',
    ]);
    expect(article).toHaveTextContent('/api/v1/players/auth');
    expect(article).toHaveTextContent('X-API-Key');
  });

  it('fills in this deployment\'s addresses, leaving no placeholder in the page', async () => {
    renderDocs('/docs/quickstart');

    const article = (await screen.findByRole('heading', { level: 1, name: 'Quickstart' })).closest('article');
    expect(article.textContent).not.toMatch(/\{\{|\}\}/);
    expect(article).toHaveTextContent('/v1/clan-sdk.js');
  });

  it('copies a code sample with its Copy button', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    renderDocs('/docs/quickstart');
    await screen.findByRole('heading', { level: 1, name: 'Quickstart' });

    await user.click(screen.getAllByRole('button', { name: 'Copy' })[0]);

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/api/v1/players/auth'));
  });

  it('keeps links to the app inside the app', async () => {
    const user = userEvent.setup();
    renderDocs('/docs/quickstart');

    await user.click(await screen.findByRole('link', { name: 'Your games' }));

    expect(await screen.findByRole('heading', { name: 'Games stand-in' })).toBeInTheDocument();
  });
});

describe('fillAddresses', () => {
  it('replaces every placeholder, however often it appears', () => {
    const text = fillAddresses('a {{SDK_URL}} b {{PLATFORM_URL}} c {{PLATFORM_URL}} d {{SOCIAL_URL}} e {{REALTIME_URL}}');

    expect(text).not.toContain('{{');
    expect(text.match(/http/g)).toHaveLength(5);
  });
});
