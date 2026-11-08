import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { AppLayout } from './AppLayout';
import { HeaderSlot } from './HeaderSlot';

function renderLayout(page) {
  const router = createMemoryRouter(
    [{ element: <AppLayout actions={<span>Demo Dev</span>} />, children: [{ path: '/', element: page }] }],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}

describe('AppLayout', () => {
  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('shows the brand, the links, the theme toggle and the account area in the header', async () => {
    renderLayout(<p>Page body</p>);

    const header = await screen.findByRole('banner');
    expect(header).toHaveTextContent('SocialKit Studio');
    expect(header.querySelector('.app-brand')).toHaveAttribute('href', '/');
    expect(header.querySelector('nav')).toHaveAccessibleName('Main');
    expect(header).toContainElement(screen.getByRole('group', { name: 'Color theme' }));
    expect(header).toHaveTextContent('Demo Dev');
  });

  it('switches the theme from the header', async () => {
    renderLayout(<p>Page body</p>);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Dark theme' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
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
