import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HomeDemo } from './HomeDemo';

const widget = (container) => within(container.querySelector('[data-clan-ui]').shadowRoot.querySelector('.sk-root'));
const tabNames = (container) => widget(container).getAllByRole('tab').map((tab) => tab.textContent.trim());
const tabSwitch = (name) => screen.getByRole('switch', { name });

describe('HomeDemo', () => {
  it('draws the real widget with mock data and all three tabs', () => {
    const { container } = render(<HomeDemo />);

    expect(widget(container).getByText('Nova Squad')).toBeInTheDocument();
    expect(tabNames(container)).toHaveLength(3);
  });

  it('takes a tab out of the widget when its switch is turned off, and puts it back', async () => {
    const user = userEvent.setup();
    const { container } = render(<HomeDemo />);

    await user.click(tabSwitch('Chat'));
    expect(tabNames(container)).toHaveLength(2);
    expect(widget(container).queryByRole('tab', { name: /Chat/ })).not.toBeInTheDocument();

    await user.click(tabSwitch('Chat'));
    expect(tabNames(container)).toHaveLength(3);
  });

  it('keeps the last tab on and says why', async () => {
    const user = userEvent.setup();
    const { container } = render(<HomeDemo />);

    await user.click(tabSwitch('Friends'));
    await user.click(tabSwitch('Chat'));
    await user.click(tabSwitch('Clan'));

    expect(tabSwitch('Clan')).toBeChecked();
    expect(tabNames(container)).toHaveLength(1);
    expect(screen.getByText(/at least one tab/)).toBeInTheDocument();
  });

  it('marks the chosen brand colour', async () => {
    const user = userEvent.setup();
    render(<HomeDemo />);
    const colors = within(screen.getByRole('group', { name: 'Brand colour' }));

    expect(colors.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(colors.getByRole('button', { name: 'Lime' }));

    expect(colors.getByRole('button', { name: 'Lime' })).toHaveAttribute('aria-pressed', 'true');
    expect(colors.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-pressed', 'false');
  });
});
