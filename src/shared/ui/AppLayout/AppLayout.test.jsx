import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AppLayout } from './AppLayout';
import { HeaderSlot } from './HeaderSlot';
import { TopSlot } from './TopSlot';

function renderLayout(page) {
  const router = createMemoryRouter(
    [{ element: <AppLayout actions={<span>Demo Dev</span>} />, children: [{ path: '/', element: page }] }],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}

describe('AppLayout', () => {
  it('shows the brand and the account area in the header', async () => {
    renderLayout(<p>Page body</p>);

    const header = await screen.findByRole('banner');
    expect(header).toHaveTextContent('Sociable');
    // One wordmark per theme; the stylesheet (not loaded in tests) shows only the one that fits.
    expect(within(header).getAllByRole('img', { name: 'Xsolla' })).toHaveLength(2);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(`© ${new Date().getFullYear()} Sociable`);
    expect(footer).not.toHaveTextContent('developer dashboard');
    expect(within(footer).getByRole('link', { name: 'Xsolla on LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/company/xsolla/');
    expect(within(footer).getAllByRole('link', { name: /^Xsolla on / })).toHaveLength(5);
    expect(within(footer).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
    expect(header.querySelector('.app-brand')).toHaveAttribute('href', '/');
    expect(header).toHaveTextContent('Demo Dev');
    // The theme switch is part of the frame, so it is there signed in or not.
    expect(within(header).getByRole('button', { name: /^Switch to (dark|light) theme$/ })).toBeInTheDocument();
  });

  it('lets a page put its own controls in the header, not in the page body', async () => {
    renderLayout(
      <>
        <HeaderSlot>
          <button type="button">Page control</button>
        </HeaderSlot>
        <p>Page body</p>
      </>,
    );

    const control = await screen.findByRole('button', { name: 'Page control' });

    expect(screen.getByRole('banner')).toContainElement(control);
    expect(screen.getByRole('main')).not.toContainElement(control);
  });
});

describe('TopSlot', () => {
  it('lets a page put a notice above the header', async () => {
    renderLayout(
      <>
        <TopSlot>
          <p>Page notice</p>
        </TopSlot>
        <p>Page body</p>
      </>,
    );

    const notice = await screen.findByText('Page notice');
    const header = screen.getByRole('banner');

    expect(screen.getByRole('main')).not.toContainElement(notice);
    expect(header).not.toContainElement(notice);
    // DOCUMENT_POSITION_FOLLOWING: the header comes after the notice in the page.
    expect(notice.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders its children in place without an app frame', () => {
    render(
      <TopSlot>
        <p>Page notice</p>
      </TopSlot>,
    );

    expect(screen.getByText('Page notice')).toBeInTheDocument();
  });
});

describe('HeaderSlot without an app header', () => {
  it('renders its children in place', () => {
    render(
      <HeaderSlot>
        <button type="button">Page control</button>
      </HeaderSlot>,
    );

    expect(screen.getByRole('button', { name: 'Page control' })).toBeInTheDocument();
  });
});
