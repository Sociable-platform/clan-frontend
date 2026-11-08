import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildWidgetConfig } from '@/test/builders';

import { PreviewPanel } from './PreviewPanel';

const widget = (container) => within(container.querySelector('[data-clan-ui]').shadowRoot.querySelector('.sk-root'));
const chip = (name) => screen.getByRole('button', { name });

describe('PreviewPanel', () => {
  it('draws the draft with the shared widget renderer, open, with mock data', () => {
    const config = buildWidgetConfig((draft) => {
      draft.texts.labels.panelTitle = 'Arena Social';
    });
    const { container } = render(<PreviewPanel config={config} />);

    expect(screen.getByRole('heading', { name: 'Live preview' })).toBeInTheDocument();
    expect(widget(container).getByRole('heading', { name: 'Arena Social' })).toBeInTheDocument();
    expect(widget(container).getByText('Nova Squad')).toBeInTheDocument();
    expect(chip(/Home & chat/)).toHaveAttribute('aria-pressed', 'true');
  });

  it('draws no fake game, only the widget on a plain surface', () => {
    const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
    expect(container.querySelector('.preview-canvas').children).toHaveLength(1);
  });

  it('follows the draft as it changes, without mounting a second panel', () => {
    const { container, rerender } = render(<PreviewPanel config={buildWidgetConfig()} />);

    rerender(<PreviewPanel config={buildWidgetConfig((draft) => (draft.texts.labels.panelTitle = 'Hub'))} />);

    expect(widget(container).getByRole('heading', { name: 'Hub' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-clan-ui]')).toHaveLength(1);
  });

  it('shows the clan screen picked in the picker', async () => {
    const user = userEvent.setup();
    const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

    await user.click(chip(/Members/));

    expect(widget(container).getByRole('button', { name: 'Back to clan' })).toBeInTheDocument();

    await user.click(chip(/Discover/));

    expect(widget(container).getAllByRole('button', { name: 'Join' }).length).toBeGreaterThan(0);
  });

  it('keeps the picker in step with the widget: joining a clan lands on home, leaving on discover', async () => {
    const user = userEvent.setup();
    const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

    await user.click(chip(/Discover/));
    await user.click(widget(container).getAllByRole('button', { name: 'Join' })[0]);

    expect(chip(/Home & chat/)).toHaveAttribute('aria-pressed', 'true');

    await user.click(widget(container).getByRole('button', { name: 'Show clan info' }));
    await user.click(widget(container).getByRole('button', { name: 'Leave clan' }));
    await user.click(widget(container).getAllByRole('button', { name: 'Leave clan' }).at(-1));

    expect(chip(/Discover/)).toHaveAttribute('aria-pressed', 'true');
  });

  describe('friends and chat tabs', () => {
    it('shows the friends tab from the picker and from the widget tab bar', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

      await user.click(chip('Friends'));

      expect(widget(container).getByText('Friends · 3')).toBeInTheDocument();
      expect(chip('Friends')).toHaveAttribute('aria-pressed', 'true');

      await user.click(widget(container).getByRole('tab', { name: 'Clan' }));

      expect(chip(/Home & chat/)).toHaveAttribute('aria-pressed', 'true');

      await user.click(widget(container).getByRole('tab', { name: 'Chat' }));

      expect(chip('Chat')).toHaveAttribute('aria-pressed', 'true');
      expect(widget(container).getByText('gg, rematch?')).toBeInTheDocument();
    });

    it('accepts a request and shows the new friend', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

      await user.click(chip('Friends'));
      await user.click(widget(container).getByRole('button', { name: 'Accept · Aysel' }));

      expect(widget(container).queryByText(/sent a request/)).not.toBeInTheDocument();
      expect(widget(container).getByText('Friends · 4')).toBeInTheDocument();
      expect(widget(container).getByText('Just added')).toBeInTheDocument();
    });

    it('sends a message in a conversation and keeps it there', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

      await user.click(chip('Friends'));
      await user.click(widget(container).getByRole('button', { name: 'Chat · Farida' }));
      await user.type(widget(container).getByRole('textbox', { name: 'Message…' }), 'tonight at 9');
      await user.click(widget(container).getByRole('button', { name: 'Send' }));

      expect(widget(container).getByText('tonight at 9')).toBeInTheDocument();
      expect(chip('Chat')).toHaveAttribute('aria-pressed', 'true');

      await user.click(widget(container).getByRole('button', { name: 'Rashad' }));

      expect(widget(container).queryByText('tonight at 9')).not.toBeInTheDocument();
    });
  });

  describe('managing members', () => {
    const openMembers = async (user, container) => {
      await user.click(chip(/Members/));
      return widget(container);
    };

    it('lets you view the clan as any role, the strongest by default', () => {
      render(<PreviewPanel config={buildWidgetConfig()} />);

      const select = screen.getByRole('combobox', { name: 'Viewing as' });

      expect(select).toHaveValue('leader');
      expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['Leader', 'Co-leader', 'Elder', 'Member']);
    });

    it('promotes a member as the leader and shows the new role', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);
      const members = await openMembers(user, container);

      await user.click(members.getByRole('button', { name: /^Aysel, Member/ }));
      await user.click(members.getByRole('button', { name: 'Promote to Elder' }));

      expect(members.getByRole('button', { name: /^Aysel, Elder/ })).toBeInTheDocument();
      expect(members.getByRole('button', { name: 'Promote to Co-leader' })).toBeInTheDocument();
    });

    it('kicks a member after confirming and updates the count', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);
      const members = await openMembers(user, container);

      expect(members.getByText('4 / 30')).toBeInTheDocument();

      await user.click(members.getByRole('button', { name: /^Aysel, Member/ }));
      await user.click(members.getByRole('button', { name: 'Kick' }));
      await user.click(within(members.getByRole('alertdialog')).getByRole('button', { name: 'Kick' }));

      expect(members.queryByText('Aysel')).not.toBeInTheDocument();
      expect(members.getByText('3 / 30')).toBeInTheDocument();
    });

    it('shows what a weaker role can do: the co-leader cannot promote to its own role, an elder can do nothing', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);
      const members = await openMembers(user, container);

      await user.selectOptions(screen.getByRole('combobox', { name: 'Viewing as' }), 'co-leader');
      await user.click(members.getByRole('button', { name: /^Farida, Elder/ }));

      expect(members.queryByRole('button', { name: /^Promote/ })).not.toBeInTheDocument();
      expect(members.getByRole('button', { name: 'Demote to Member' })).toBeInTheDocument();

      await user.selectOptions(screen.getByRole('combobox', { name: 'Viewing as' }), 'elder');

      expect(members.queryByRole('button', { name: /Manage$/ })).not.toBeInTheDocument();
    });

    it('offers the roles the developer defines, and starts the members again when the roles change', async () => {
      const user = userEvent.setup();
      const { container, rerender } = render(<PreviewPanel config={buildWidgetConfig()} />);
      const members = await openMembers(user, container);
      await user.click(members.getByRole('button', { name: /^Aysel, Member/ }));
      await user.click(members.getByRole('button', { name: 'Kick' }));
      await user.click(within(members.getByRole('alertdialog')).getByRole('button', { name: 'Kick' }));

      rerender(
        <PreviewPanel
          config={buildWidgetConfig((draft) => {
            draft.clan.roles.splice(3, 0, { id: 'captain', name: 'Captain', canPromote: true, canKick: false });
          })}
        />,
      );

      expect(within(screen.getByRole('combobox', { name: 'Viewing as' })).getAllByRole('option').map((option) => option.textContent)).toEqual([
        'Leader',
        'Captain',
        'Co-leader',
        'Elder',
        'Member',
      ]);
      expect(widget(container).getByText('Aysel')).toBeInTheDocument();
    });
  });

  it('takes the widget out of the page when the preview goes away', () => {
    const { container, unmount } = render(<PreviewPanel config={buildWidgetConfig()} />);
    const host = container.querySelector('[data-clan-ui]');

    unmount();

    expect(host.isConnected).toBe(false);
  });

  it('adds one Google Fonts link for the fonts in the draft', () => {
    render(<PreviewPanel config={buildWidgetConfig()} />);

    const links = document.head.querySelectorAll('link[data-widget-preview-fonts]');

    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?family=/);
  });
});
