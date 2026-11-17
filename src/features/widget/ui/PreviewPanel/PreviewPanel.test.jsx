import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildWidgetConfig } from '@/test/builders';

import { PreviewPanel } from './PreviewPanel';

const widget = (container) => within(container.querySelector('[data-clan-ui]').shadowRoot.querySelector('.sk-root'));
const chip = (name) => screen.getByRole('button', { name });
/** Open the Clan chip's list and pick a clan screen. */
const pickClanScreen = async (user, name) => {
  await user.click(chip(/^Clan/));
  await user.click(screen.getByRole('menuitemradio', { name }));
};

const viewerButton = () => screen.getByRole('button', { name: /^Viewing as/ });

/** Opens the "Viewing as" menu, reads the roles it offers, and closes it again. */
const viewerRoles = async (user) => {
  await user.click(viewerButton());
  const names = screen.getAllByRole('menuitemradio').map((item) => item.textContent);
  await user.keyboard('{Escape}');
  return names;
};

const viewAs = async (user, role) => {
  await user.click(viewerButton());
  await user.click(screen.getByRole('menuitemradio', { name: role }));
};

describe('PreviewPanel', () => {
  it('shows "Viewing as" as a labelled menu button that names the role, with no "?" beside it', () => {
    render(<PreviewPanel config={buildWidgetConfig()} />);

    expect(screen.getByRole('button', { name: 'Viewing as Leader' })).toHaveAttribute('aria-haspopup', 'menu');
    // The same kind of control as the Clan chip beside it, not the browser's own list.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'About viewing as a role' })).not.toBeInTheDocument();
  });

  it('shows no "?" next to the title', () => {
    render(<PreviewPanel config={buildWidgetConfig()} />);

    expect(screen.queryByRole('button', { name: 'About the preview' })).not.toBeInTheDocument();
  });

  it('draws the draft with the shared widget renderer, open, with mock data', () => {
    const config = buildWidgetConfig((draft) => {
      draft.texts.labels.panelTitle = 'Arena Social';
    });
    const { container } = render(<PreviewPanel config={config} />);

    expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument();
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

    await pickClanScreen(user, /Members/);

    expect(widget(container).getByRole('button', { name: 'Back to clan' })).toBeInTheDocument();
    expect(chip(/^Clan/)).toHaveTextContent('Members');

    await pickClanScreen(user, /Discover/);

    expect(widget(container).getAllByRole('button', { name: 'Join' }).length).toBeGreaterThan(0);
  });

  it('keeps the picker in step with the widget: joining a clan lands on home, leaving on discover', async () => {
    const user = userEvent.setup();
    const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

    await pickClanScreen(user, /Discover/);
    await user.click(widget(container).getAllByRole('button', { name: 'Join' })[0]);

    expect(chip(/Home & chat/)).toHaveAttribute('aria-pressed', 'true');

    await user.click(widget(container).getByRole('button', { name: /Show clan info$/ }));
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
      // The Chat tab opens on the conversation list.
      expect(widget(container).getByRole('list', { name: 'Conversations' })).toBeInTheDocument();
    });

    it('accepts a request and shows the new friend', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

      await user.click(chip('Friends'));
      await user.click(widget(container).getByRole('button', { name: 'Accept · Dana' }));

      expect(widget(container).queryByText(/sent a request/)).not.toBeInTheDocument();
      expect(widget(container).getByText('Friends · 4')).toBeInTheDocument();
      expect(widget(container).getByText('Dana')).toBeInTheDocument();
    });

    it('sends a message in a conversation and keeps it there', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

      await user.click(chip('Friends'));
      await user.click(widget(container).getByRole('button', { name: 'Chat · Cara' }));
      await user.type(widget(container).getByRole('textbox', { name: 'Message…' }), 'tonight at 9');
      await user.click(widget(container).getByRole('button', { name: 'Send' }));

      expect(widget(container).getByText('tonight at 9')).toBeInTheDocument();
      expect(chip('Chat')).toHaveAttribute('aria-pressed', 'true');

      // Back on the list, Cara's row shows the message as her last one; Ben's conversation does not have it.
      await user.click(widget(container).getByRole('tab', { name: 'Chat' }));

      expect(widget(container).getByText('You: tonight at 9')).toBeInTheDocument();

      await user.click(widget(container).getByRole('button', { name: /^Ben/ }));

      expect(widget(container).queryByText(/tonight at 9/)).not.toBeInTheDocument();
    });
  });

  describe('slow mode', () => {
    const send = async (user, container, text) => {
      // Opening Home marks the clan chat read, and the preview repaints once for it; type after that.
      await act(async () => {});
      await user.type(widget(container).getByRole('textbox', { name: 'Message…' }), text);
      await user.click(widget(container).getByRole('button', { name: 'Send' }));
    };
    const withSlowMode = (seconds) => buildWidgetConfig((draft) => (draft.chat.slowModeSeconds = seconds));

    it('counts the wait down on Send after a message, from 4 seconds up', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={withSlowMode(5)} />);

      await send(user, container, 'hello clan');

      expect(widget(container).getByText('hello clan')).toBeInTheDocument();
      expect(widget(container).getByRole('button', { name: /^[45]s$/ })).toBeDisabled();
    });

    it('only switches Send off for a shorter wait', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={withSlowMode(2)} />);

      await send(user, container, 'hello clan');

      expect(widget(container).getByRole('button', { name: 'Send' })).toBeDisabled();
    });

    it('leaves Send alone when slow mode is off', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={withSlowMode(0)} />);

      await send(user, container, 'hello clan');

      expect(widget(container).getByRole('button', { name: 'Send' })).toBeEnabled();
    });
  });

  describe('managing members', () => {
    const openMembers = async (user, container) => {
      await pickClanScreen(user, /Members/);
      return widget(container);
    };

    it('lets you view the clan as any role, the strongest by default', async () => {
      const user = userEvent.setup();
      render(<PreviewPanel config={buildWidgetConfig()} />);

      expect(viewerButton()).toHaveTextContent('Leader');
      await user.click(viewerButton());

      expect(screen.getAllByRole('menuitemradio').map((item) => item.textContent)).toEqual(['Leader', 'Co-leader', 'Elder', 'Member']);
      expect(screen.getByRole('menuitemradio', { name: 'Leader' })).toBeChecked();
    });

    it('promotes a member as the leader and shows the new role', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);
      const members = await openMembers(user, container);

      await user.click(members.getByRole('button', { name: /^Dana, Member/ }));
      await user.click(members.getByRole('button', { name: 'Promote to Elder' }));

      expect(members.getByRole('button', { name: /^Dana, Elder/ })).toBeInTheDocument();
      expect(members.getByRole('button', { name: 'Promote to Co-leader' })).toBeInTheDocument();
    });

    it('kicks a member after confirming and updates the count', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);
      const members = await openMembers(user, container);

      expect(members.getByText('4 / 30')).toBeInTheDocument();

      await user.click(members.getByRole('button', { name: /^Dana, Member/ }));
      await user.click(members.getByRole('button', { name: 'Kick' }));
      await user.click(within(members.getByRole('alertdialog')).getByRole('button', { name: 'Kick' }));

      expect(members.queryByText('Dana')).not.toBeInTheDocument();
      expect(members.getByText('3 / 30')).toBeInTheDocument();
    });

    it('shows what a weaker role can do: the co-leader cannot promote to its own role, an elder can do nothing', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);
      const members = await openMembers(user, container);

      await viewAs(user, 'Co-leader');
      expect(viewerButton()).toHaveTextContent('Co-leader');
      await user.click(members.getByRole('button', { name: /^Cara, Elder/ }));

      expect(members.queryByRole('button', { name: /^Promote/ })).not.toBeInTheDocument();
      expect(members.getByRole('button', { name: 'Demote to Member' })).toBeInTheDocument();

      await viewAs(user, 'Elder');

      expect(members.queryByRole('button', { name: /Manage$/ })).not.toBeInTheDocument();
    });

    it('offers the roles the developer defines, and starts the members again when the roles change', async () => {
      const user = userEvent.setup();
      const { container, rerender } = render(<PreviewPanel config={buildWidgetConfig()} />);
      const members = await openMembers(user, container);
      await user.click(members.getByRole('button', { name: /^Dana, Member/ }));
      await user.click(members.getByRole('button', { name: 'Kick' }));
      await user.click(within(members.getByRole('alertdialog')).getByRole('button', { name: 'Kick' }));

      rerender(
        <PreviewPanel
          config={buildWidgetConfig((draft) => {
            draft.clan.roles.splice(3, 0, { id: 'captain', name: 'Captain', canPromote: true, canKick: false });
          })}
        />,
      );

      expect(await viewerRoles(user)).toEqual([
        'Leader',
        'Captain',
        'Co-leader',
        'Elder',
        'Member',
      ]);
      expect(widget(container).getByText('Dana')).toBeInTheDocument();
    });
  });

  describe('finding other clans from inside the clan', () => {
    it('opens the clan search from the Clan tab\'s search icon with the player still in the clan', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

      await user.click(widget(container).getByRole('button', { name: 'Find clans' }));

      expect(widget(container).getByRole('button', { name: 'Back to clan' })).toBeInTheDocument();
      expect(widget(container).getByText('Leave your clan to join another.')).toBeInTheDocument();
      expect(widget(container).getByRole('button', { name: 'Joined' })).toBeDisabled();

      // The Clan chip names the screen, but this is not the "no clan" Discover of the list: nothing is ticked there.
      expect(chip(/^Clan/)).toHaveTextContent('Discover');
      await user.click(chip(/^Clan/));
      screen.getAllByRole('menuitemradio').forEach((item) => expect(item).toHaveAttribute('aria-checked', 'false'));
    });

    it('goes back to Home, and Home is selected again', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);
      await user.click(widget(container).getByRole('button', { name: 'Find clans' }));

      await user.click(widget(container).getByRole('button', { name: 'Back to clan' }));

      expect(screen.getByRole('button', { name: /Home & chat/ })).toHaveAttribute('aria-pressed', 'true');
    });

    it('keeps the "no clan" Discover for a player without a clan, where Join works', async () => {
      const user = userEvent.setup();
      const { container } = render(<PreviewPanel config={buildWidgetConfig()} />);

      await pickClanScreen(user, /Discover/);

      expect(chip(/Discover/)).toHaveAttribute('aria-pressed', 'true');
      expect(widget(container).queryByRole('button', { name: 'Back to clan' })).not.toBeInTheDocument();

      await user.click(widget(container).getAllByRole('button', { name: 'Join' })[0]);

      expect(chip(/Home & chat/)).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('lists the picker like the widget tab bar: Friends, Clan, Chat, with the role list beside it', () => {
    render(<PreviewPanel config={buildWidgetConfig()} />);

    const picker = screen.getByRole('group', { name: 'Widget view to preview' });
    const names = within(picker)
      .getAllByRole('button')
      .map((button) => button.textContent);

    expect(names).toEqual(['Friends', 'Clan · Home & chat', 'Chat']);
    expect(picker.parentElement).toContainElement(viewerButton());
  });

  it('offers the four clan screens under the Clan chip, with the one on show ticked', async () => {
    const user = userEvent.setup();
    render(<PreviewPanel config={buildWidgetConfig()} />);

    await user.click(chip(/^Clan/));

    expect(screen.getAllByRole('menuitemradio').map((item) => item.textContent)).toEqual([
      'Home & chatin a clan',
      'Membersin a clan',
      'Discoverno clan',
      'Createno clan',
    ]);
    expect(screen.getByRole('menuitemradio', { name: /Home & chat/ })).toHaveAttribute('aria-checked', 'true');
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
