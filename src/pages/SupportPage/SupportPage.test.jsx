import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SUPPORT_EMAIL } from '@/shared/config';
import { renderWithRouter } from '@/test/renderWithRouter';

import { SupportPage } from './SupportPage';

const renderSupport = () =>
  renderWithRouter([{ path: '/support', element: <SupportPage /> }], { initialEntries: ['/support'] });

describe('SupportPage', () => {
  it('shows the support address as a mail link', () => {
    renderSupport();

    expect(screen.getByRole('heading', { level: 1, name: 'Support' })).toBeInTheDocument();
    expect(SUPPORT_EMAIL).not.toBe('');
    expect(screen.getByRole('link', { name: SUPPORT_EMAIL })).toHaveAttribute('href', `mailto:${SUPPORT_EMAIL}`);
  });

  it('copies the address', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    renderSupport();

    await user.click(screen.getByRole('button', { name: 'Copy address' }));

    expect(writeText).toHaveBeenCalledWith(SUPPORT_EMAIL);
  });

  it('tells the developer not to send keys and points at the guide', () => {
    renderSupport();

    expect(screen.getByText(/Never send an API key or a player token/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Troubleshooting' })).toHaveAttribute('href', '/docs/troubleshooting');
    expect(screen.getByRole('link', { name: 'games page' })).toHaveAttribute('href', '/games');
  });
});
