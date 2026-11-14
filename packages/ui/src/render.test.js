import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockData } from './data/mockData.js';
import { loadExample, mount } from './testUtils.js';

afterEach(() => {
  document.body.replaceChildren();
});

const arena = () => loadExample('valid/arena.json');

describe('render', () => {
  it('mounts the panel in a Shadow DOM and removes it on destroy', () => {
    const { container, handle, shadow } = mount(arena());

    expect(container.firstElementChild.shadowRoot).toBe(shadow);
    expect(container.querySelector('.sk-panel')).toBeNull();

    handle.destroy();
    handle.destroy();

    expect(container.childElementCount).toBe(0);
  });

  it('draws the title and tabs from the config texts', () => {
    const { ui } = mount(arena());

    expect(ui().getByRole('heading', { name: 'Arena Social' })).toBeInTheDocument();
    expect(ui().getByRole('tab', { name: 'Friends' })).toBeInTheDocument();
    expect(ui().getByRole('tab', { name: 'Clan', selected: true })).toBeInTheDocument();
    expect(ui().getByRole('tab', { name: 'Chat' })).toBeInTheDocument();
  });

  it('has no launcher button: the panel is always open, and the game shows or hides the widget itself', () => {
    const config = { ...arena(), layout: { ...arena().layout, startCollapsed: true } };
    const { ui, root } = mount(config, { ...createMockData(config), open: false });

    expect(root().querySelector('.sk-panel').hidden).toBe(false);
    expect(root().querySelector('.sk-launcher')).toBeNull();
    expect(ui().queryByRole('button', { name: 'Social' })).not.toBeInTheDocument();
  });

  describe('home screen', () => {
    it('shows the clan header and its chat, with the config limits', () => {
      const config = arena();
      const { ui } = mount(config, { ...createMockData(config), screen: 'home', open: true });

      expect(ui().getByText('Nova Squad')).toBeInTheDocument();
      expect(ui().getByText('[NOVA]')).toBeInTheDocument();
      // Closed, the header is only the clan name.
      expect(ui().queryByText(/4 \/ 30/)).not.toBeInTheDocument();
      expect(ui().queryByText(/Lv 7/)).not.toBeInTheDocument();
      expect(ui().getByText('Raid at 9?')).toBeInTheDocument();
      expect(ui().getByRole('textbox', { name: 'Message…' })).toHaveAttribute('maxlength', '300');
      expect(ui().getByText('0 / 300')).toBeInTheDocument();
      // Slow mode is enforced by the server; players are not shown the setting.
      expect(ui().queryByText(/slow mode/i)).not.toBeInTheDocument();
    });

    it('opens the info to show the stats, then asks before leaving', () => {
      const config = arena();
      const actions = { leave: vi.fn() };
      const { ui } = mount(config, { ...createMockData(config), screen: 'home', open: true, actions });

      fireEvent.click(ui().getByRole('button', { name: 'Show clan info' }));

      expect(ui().getByText('4 / 30 members')).toBeInTheDocument();
      expect(ui().queryByText(/Lv 7|Weekly XP|created Nov 2/)).not.toBeInTheDocument();

      fireEvent.click(ui().getByRole('button', { name: 'Leave clan' }));

      expect(ui().getByRole('alertdialog', { name: 'Leave clan' })).toBeInTheDocument();
      expect(ui().getByText('Leave Nova Squad?')).toBeInTheDocument();
      expect(actions.leave).not.toHaveBeenCalled();

      fireEvent.click(ui().getAllByRole('button', { name: 'Leave clan' }).at(-1));

      expect(actions.leave).toHaveBeenCalledTimes(1);
    });

    it('hides the stats when the config turns them off', () => {
      const config = arena();
      config.clan.screens.home.showStats = false;
      const { ui } = mount(config, { ...createMockData(config), screen: 'home', open: true });

      fireEvent.click(ui().getByRole('button', { name: 'Show clan info' }));

      expect(ui().queryByText('4 / 30 members')).not.toBeInTheDocument();
      expect(ui().getByRole('button', { name: 'View members' })).toBeInTheDocument();
    });

    it('shows the "chat is off" note instead of the chat when clan chat is disabled', () => {
      const config = arena();
      config.chat.clanChat = false;
      const { ui } = mount(config, { ...createMockData(config), screen: 'home', open: true });

      expect(ui().getByText('Clan chat is off for this game.')).toBeInTheDocument();
      expect(ui().queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('draws the chat as a log when the layout is log, with the clan tag before each name', () => {
      const config = arena();
      config.chat.layout = 'log';
      const { ui, root } = mount(config, { ...createMockData(config), screen: 'home', open: true });

      expect(root().querySelectorAll('.sk-log')).toHaveLength(3);
      expect(ui().getByText('[NOVA] Ben')).toBeInTheDocument();
      expect(ui().getByText('[NOVA] You')).toBeInTheDocument();
    });

    it('sends a typed message through the host action and clears the box', () => {
      const config = arena();
      const actions = { sendMessage: vi.fn() };
      const { ui } = mount(config, { ...createMockData(config), screen: 'home', open: true, actions });

      fireEvent.input(ui().getByRole('textbox', { name: 'Message…' }), { target: { value: 'gg' } });
      fireEvent.click(ui().getByRole('button', { name: 'Send' }));

      expect(actions.sendMessage).toHaveBeenCalledWith('gg', { conversation: 'clan' });
      expect(ui().getByRole('textbox', { name: 'Message…' })).toHaveValue('');
    });
  });

  describe('members screen', () => {
    it('lists the roster with roles and goes back to the home screen', () => {
      const config = arena();
      const actions = { screenChanged: vi.fn() };
      const { ui, root } = mount(config, { ...createMockData(config), screen: 'members', open: true, actions });

      expect(ui().getByText('Members')).toBeInTheDocument();
      expect([...root().querySelectorAll('.sk-role')].map((pill) => pill.textContent)).toEqual(['Leader', 'Co-leader', 'Elder', 'Member']);
      expect(ui().getByText('Dana')).toBeInTheDocument();

      fireEvent.click(ui().getByRole('button', { name: 'Back to clan' }));

      expect(actions.screenChanged).toHaveBeenCalledWith('home');
      expect(ui().getByText('Raid at 9?')).toBeInTheDocument();
    });

    it('asks to confirm before leaving from the roster', () => {
      const config = arena();
      const { ui } = mount(config, { ...createMockData(config), screen: 'members', open: true });

      fireEvent.click(ui().getByRole('button', { name: 'Leave clan' }));

      expect(ui().getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  describe('discover screen', () => {
    const noClan = (config, extra = {}) => ({ ...createMockData(config, { inClan: false }), screen: 'discover', open: true, ...extra });

    it('lists the clans with join buttons, and Full for a full clan', () => {
      const config = arena();
      const { ui } = mount(config, noClan(config));

      expect(ui().getByText('Iron Wolves')).toBeInTheDocument();
      expect(ui().getAllByRole('button', { name: 'Join' })).toHaveLength(2);
      expect(ui().getByRole('button', { name: 'Full' })).toBeDisabled();
      expect(ui().getByText('24 / 30 members')).toBeInTheDocument();
    });

    it('uses the config label for the create button', () => {
      const config = arena();
      const { ui } = mount(config, noClan(config));

      expect(ui().getByRole('button', { name: '+ Start a clan' })).toBeInTheDocument();
    });

    it('joins through the host action', () => {
      const config = arena();
      const actions = { join: vi.fn() };
      const { ui } = mount(config, noClan(config, { actions }));

      fireEvent.click(ui().getAllByRole('button', { name: 'Join' })[0]);

      expect(actions.join).toHaveBeenCalledWith('clan-nova');
    });

    it('filters the list as the player types without losing the box', () => {
      const config = arena();
      const { ui } = mount(config, noClan(config));
      const search = ui().getByRole('searchbox', { name: 'Search clans…' });

      fireEvent.input(search, { target: { value: 'wolv' } });

      expect(ui().getByText('Iron Wolves').closest('.sk-row')).toHaveProperty('hidden', false);
      expect(ui().getByText('Nova Squad').closest('.sk-row')).toHaveProperty('hidden', true);
      expect(ui().getByRole('searchbox', { name: 'Search clans…' })).toBe(search);
    });

    it('applies the game word for clan to the placeholders', () => {
      const config = arena();
      config.texts.terms = { clan: 'Guild', clans: 'Guilds' };
      config.texts.labels = {};
      const { ui } = mount(config, noClan(config));

      expect(ui().getByRole('searchbox', { name: 'Search guilds…' })).toBeInTheDocument();
      expect(ui().getByRole('button', { name: '+ Create a guild' })).toBeInTheDocument();
      expect(ui().getByRole('tab', { name: 'Guild' })).toBeInTheDocument();
    });

    it('hides the create button when the create screen is off', () => {
      const config = arena();
      config.clan.screens.create.enabled = false;
      const { ui } = mount(config, noClan(config));

      expect(ui().queryByRole('button', { name: /start a clan/i })).not.toBeInTheDocument();
    });
  });

  describe('create screen', () => {
    const noClan = (config, extra = {}) => ({ ...createMockData(config, { inClan: false }), screen: 'create', open: true, ...extra });

    it('shows the badges the game allows in a popup, and the form', () => {
      const config = arena();
      config.clan.badges.allowed = ['star', 'moon'];
      const { ui } = mount(config, noClan(config));

      expect(ui().getByText('Create a clan')).toBeInTheDocument();
      expect(ui().queryByRole('radio')).not.toBeInTheDocument();
      fireEvent.click(ui().getByRole('button', { name: /^Badge: Star/ }));
      expect(ui().getAllByRole('radio')).toHaveLength(2);
      expect(ui().getByRole('radio', { name: 'Star badge' })).toBeChecked();
      expect(ui().getByRole('radio', { name: 'Moon badge' })).not.toBeChecked();
      expect(ui().getByText('Up to 30 members')).toBeInTheDocument();
      expect(ui().getByRole('textbox', { name: /Description/ })).toHaveAttribute('maxlength', '140');
    });

    it('explains the neutral tag when no badge is allowed, and hides the tag field when tags are off', () => {
      const config = arena();
      config.clan.badges.allowed = [];
      config.clan.tags = false;
      const { ui } = mount(config, noClan(config));

      expect(ui().getByText('No badges enabled · the tag initial is used instead')).toBeInTheDocument();
      expect(ui().queryByRole('textbox', { name: /Tag/ })).not.toBeInTheDocument();
    });

    it('enables Create once the name is long enough and sends the form to the host', () => {
      const config = arena();
      const actions = { create: vi.fn() };
      const { ui } = mount(config, noClan(config, { actions }));
      const create = ui().getByRole('button', { name: 'Create clan' });

      expect(create).toBeDisabled();

      fireEvent.input(ui().getByRole('textbox', { name: /Name/ }), { target: { value: 'Nova Squad' } });
      fireEvent.input(ui().getByRole('textbox', { name: /Tag/ }), { target: { value: 'nova' } });
      fireEvent.click(ui().getByRole('button', { name: /^Badge: / }));
      fireEvent.click(ui().getByRole('radio', { name: 'Moon badge' }));
      fireEvent.click(ui().getByRole('button', { name: 'Create clan' }));

      expect(actions.create).toHaveBeenCalledWith({ name: 'Nova Squad', tag: 'NOVA', description: '', badge: 'moon' });
    });

    it('goes back to discover on cancel', () => {
      const config = arena();
      const actions = { screenChanged: vi.fn() };
      const { ui } = mount(config, noClan(config, { actions }));

      fireEvent.click(ui().getByRole('button', { name: 'Cancel' }));

      expect(actions.screenChanged).toHaveBeenCalledWith('discover');
      expect(ui().getByRole('searchbox')).toBeInTheDocument();
    });
  });

  describe('update', () => {
    it('shows a new config without remounting', () => {
      const config = arena();
      const { handle, ui, shadow } = mount(config);

      handle.update({ ...config, texts: { ...config.texts, labels: { panelTitle: 'Hub' } } }, { ...createMockData(config), open: true });

      expect(ui().getByRole('heading', { name: 'Hub' })).toBeInTheDocument();
      expect(shadow.querySelectorAll('.sk-root')).toHaveLength(1);
    });

    it('keeps the screen the player navigated to when only the config changes', () => {
      const config = arena();
      const data = { ...createMockData(config), screen: 'home', open: true };
      const { handle, ui } = mount(config, data);

      fireEvent.click(ui().getByRole('button', { name: 'Show clan info' }));
      fireEvent.click(ui().getByRole('button', { name: 'View members' }));
      handle.update(config, data);

      expect(ui().getByRole('button', { name: 'Back to clan' })).toBeInTheDocument();
    });

    it('follows the host when it asks for another screen', () => {
      const config = arena();
      const { handle, ui } = mount(config, { ...createMockData(config), screen: 'home', open: true });

      handle.update(config, { ...createMockData(config), screen: 'members', open: true });

      expect(ui().getByRole('button', { name: 'Back to clan' })).toBeInTheDocument();
    });

    it('moves to the clan screens when the player joins, and back to discover when they leave', () => {
      const config = arena();
      const { handle, ui } = mount(config, { ...createMockData(config, { inClan: false }), open: true });

      expect(ui().getByRole('searchbox')).toBeInTheDocument();

      handle.update(config, { ...createMockData(config), open: true });

      expect(ui().getByText('Raid at 9?')).toBeInTheDocument();

      handle.update(config, { ...createMockData(config, { inClan: false }), open: true });

      expect(ui().getByRole('searchbox')).toBeInTheDocument();
    });

    it('does nothing after destroy', () => {
      const config = arena();
      const { handle, container } = mount(config);

      handle.destroy();

      expect(() => handle.update(config, createMockData(config))).not.toThrow();
      expect(container.childElementCount).toBe(0);
    });
  });

  it('shows an empty body and no tabs when the config has every tab off', () => {
    const config = arena();
    config.friends.enabled = false;
    config.clan.enabled = false;
    config.chat.enabled = false;
    const { root } = mount(config);

    expect(root().querySelector('[role="tablist"]')).toBeNull();
    expect(root().querySelector('.sk-content').childElementCount).toBe(0);
  });

  it.each([
    ['an empty config and no data', {}, {}],
    ['a half-edited config', { clan: { maxMembers: '', descriptionMax: null }, chat: { maxMessageLength: 'abc' }, theme: { colors: { brand: '#12' } } }, createMockData({})],
    ['data without lists', arena(), { open: true, screen: 'members', clan: { name: 'Solo' } }],
  ])('does not throw for %s', (_name, config, data) => {
    expect(() => mount(config, { open: true, ...data })).not.toThrow();
  });
});
