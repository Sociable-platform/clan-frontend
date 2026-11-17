import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ROLES, useAuthStore } from '@/store';
import { buildAdmin, buildDeveloper } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { HomePage } from './HomePage';

const renderHome = () => renderWithRouter([{ path: '/', element: <HomePage /> }]);
const session = { token: 'abc', expiresAt: Date.now() + 60_000 };

describe('HomePage', () => {
  it('says what the product is in the main heading', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Clans, friends and chat. Ready to embed.');
    expect(screen.getByText(/We run the backend/)).toBeInTheDocument();
  });

  it('explains how it works in three numbered steps, the last with the SDK lines', () => {
    renderHome();

    const section = screen.getByRole('region', { name: 'Three steps to social.' });
    const steps = within(section).getAllByRole('listitem');

    expect(steps.map((step) => within(step).getByRole('heading').textContent)).toEqual([
      'Register your game',
      'Design the widget',
      'Add the SDK',
    ]);
    expect(steps[0]).toHaveTextContent('Step 01');
    expect(steps[2]).toHaveTextContent('ClanSDK.init');
  });

  it('lists the six things the product includes', () => {
    renderHome();

    const section = screen.getByRole('region', { name: 'Everything a clan needs.' });

    expect(within(section).getAllByRole('listitem')).toHaveLength(6);
    expect(within(section).getByRole('heading', { name: 'Publish without a release' })).toBeInTheDocument();
  });

  it('gives the two sections the ids the header links point at', () => {
    renderHome();

    expect(screen.getByRole('region', { name: 'Three steps to social.' })).toHaveAttribute('id', 'how-it-works');
    expect(screen.getByRole('region', { name: 'Everything a clan needs.' })).toHaveAttribute('id', 'features');
  });

  it('shows the brand artwork with a description for screen readers', () => {
    renderHome();

    const art = screen.getByRole('img', { name: /robot standing beside a robotic arm/i });
    expect(art).toHaveAttribute('loading', 'lazy');
  });

  it('shows the four numbers with what each one counts', () => {
    renderHome();

    const numbers = screen.getByRole('region', { name: 'In numbers' });

    expect(within(numbers).getAllByRole('term')).toHaveLength(4);
    expect(within(numbers).getByText('lines to embed the SDK')).toBeInTheDocument();
  });
});

describe('HomePage header controls', () => {
  it('offers a visitor Log in and Create account, and links to the two sections', () => {
    useAuthStore.getState().clearSession();
    renderHome();

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how-it-works');
    expect(screen.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features');
  });

  it('shows a signed-in developer no way-in button: Your games is in the account menu', () => {
    useAuthStore.getState().startSession({ ...session, developer: buildDeveloper() });
    renderHome();

    expect(screen.queryByRole('link', { name: 'Your games' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Create account' })).not.toBeInTheDocument();
  });

  it('shows an admin no way-in button: games belong to developers', () => {
    useAuthStore.getState().startSession({ ...session, role: ROLES.ADMIN, admin: buildAdmin() });
    renderHome();

    expect(screen.queryByRole('link', { name: 'Your games' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });

  it('offers a visitor the same destinations in the phone menu, the guide included', async () => {
    useAuthStore.getState().clearSession();
    renderHome();

    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const items = within(screen.getByRole('menu')).getAllByRole('menuitem');
    expect(items.map((item) => [item.textContent, item.getAttribute('href')])).toEqual([
      ['How it works', '#how-it-works'],
      ['Features', '#features'],
      ['Docs', '/docs'],
      ['Log in', '/login'],
      ['Create account', '/register'],
    ]);
  });

  it('keeps Your games out of the phone menu for a signed-in developer', async () => {
    useAuthStore.getState().startSession({ ...session, developer: buildDeveloper() });
    renderHome();

    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const items = within(screen.getByRole('menu')).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['How it works', 'Features', 'Docs']);
  });

  it('closes the phone menu with Escape and gives focus back to its button', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Menu' }));

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
  });

  it('shows the announcement strip', () => {
    window.localStorage.clear();
    renderHome();

    expect(screen.getByText(/Players see it without a game update/)).toBeInTheDocument();
  });

  it('closes the announcement strip and keeps it closed on the next visit', async () => {
    window.localStorage.clear();
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: 'Close announcement' }));
    expect(screen.queryByText(/Players see it without a game update/)).not.toBeInTheDocument();

    cleanup();
    renderHome();
    expect(screen.queryByText(/Players see it without a game update/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close announcement' })).not.toBeInTheDocument();
  });

  it('shows the strip again when the closed announcement was a different one', () => {
    window.localStorage.setItem('clan.home.announcement.closed', 'an older announcement');

    renderHome();

    expect(screen.getByText(/Players see it without a game update/)).toBeInTheDocument();
    window.localStorage.clear();
  });
});
