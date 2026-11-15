import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMockData } from './data/mockData.js';
import { loadExample, mount } from './testUtils.js';

afterEach(() => {
  document.body.replaceChildren();
});

const arena = () => loadExample('valid/arena.json');
const home = (config, extra = {}) => mount(config, { ...createMockData(config), screen: 'home', open: true, ...extra });

const finder = (view) => view.ui().getByRole('button', { name: 'Find clans' });
const openFinder = (view) => fireEvent.click(finder(view));

describe('the search icon on the Clan tab', () => {
  it('sits in the same control as the Clan tab, for a member of a clan', () => {
    const view = home(arena());

    expect(finder(view).closest('.sk-tab-group')).toContainElement(view.ui().getByRole('tab', { name: 'Clan' }));
    expect(finder(view)).toHaveAttribute('aria-pressed', 'false');
  });

  it('is not an extra button on the Home info card any more', () => {
    const view = home(arena());

    fireEvent.click(view.ui().getByRole('button', { name: /Show clan info$/ }));

    expect(view.ui().getAllByRole('button', { name: 'Find clans' })).toHaveLength(1);
    expect(finder(view).closest('.sk-tabs')).not.toBeNull();
  });

  it('uses the game word for clan in its name', () => {
    const config = arena();
    config.texts.terms = { clan: 'Guild', clans: 'Guilds' };
    const view = home(config);

    expect(view.ui().getByRole('button', { name: 'Find guilds' })).toBeInTheDocument();
  });

  it('is not there when the discover screen is off, when the player has no clan, or when the Clan tab is off', () => {
    const noDiscover = arena();
    noDiscover.clan.screens.discover.enabled = false;
    const noClanTab = arena();
    noClanTab.clan.enabled = false;

    expect(home(noDiscover).ui().queryByRole('button', { name: 'Find clans' })).not.toBeInTheDocument();
    expect(mount(arena(), { ...createMockData(arena(), { inClan: false }), screen: 'discover', open: true }).ui().queryByRole('button', { name: 'Find clans' })).not.toBeInTheDocument();
    expect(home(noClanTab).ui().queryByRole('button', { name: 'Find clans' })).not.toBeInTheDocument();
  });

  it('keeps the Clan tab itself working: clicking the name opens the clan, clicking the icon opens the search', () => {
    const view = home(arena());

    openFinder(view);

    expect(view.ui().getByRole('tab', { name: 'Clan', selected: true })).toBeInTheDocument();
    expect(view.ui().getByText('Leave your clan to join another.')).toBeInTheDocument();

    fireEvent.click(view.ui().getByRole('tab', { name: 'Clan' }));

    expect(view.ui().getByText('Leave your clan to join another.')).toBeInTheDocument();
  });

  it('opens the search from another tab, switching to the Clan tab', () => {
    const config = arena();
    const actions = { tabChanged: vi.fn(), screenChanged: vi.fn() };
    const view = mount(config, { ...createMockData(config), tab: 'friends', open: true, actions });

    expect(view.ui().getByText('Friends · 3')).toBeInTheDocument();

    openFinder(view);

    expect(view.ui().getByRole('tab', { name: 'Clan', selected: true })).toBeInTheDocument();
    expect(view.ui().getByText('Leave your clan to join another.')).toBeInTheDocument();
    expect(actions.tabChanged).toHaveBeenCalledWith('clan');
    expect(actions.screenChanged).toHaveBeenCalledWith('discover');
  });

  it('is pressed while the search is open, and closes it on a second click', () => {
    const view = home(arena());

    openFinder(view);

    expect(finder(view)).toHaveAttribute('aria-pressed', 'true');

    openFinder(view);

    expect(finder(view)).toHaveAttribute('aria-pressed', 'false');
    expect(view.ui().getByRole('textbox', { name: 'Message…' })).toBeInTheDocument();
  });

  it('keeps focus on the icon after it is pressed', () => {
    const view = home(arena());
    finder(view).focus();

    openFinder(view);

    expect(view.shadow.activeElement).toBe(finder(view));
  });
});

describe('finding other clans from inside a clan', () => {
  it('opens the clan search with a title, a way back and the list of clans', () => {
    const config = arena();
    const actions = { screenChanged: vi.fn() };
    const view = home(config, { actions });

    openFinder(view);

    expect(actions.screenChanged).toHaveBeenCalledWith('discover');
    expect(view.ui().getByText('Find clans')).toBeInTheDocument();
    expect(view.ui().getByRole('button', { name: 'Back to clan' })).toBeInTheDocument();
    expect(view.ui().getByRole('searchbox', { name: 'Search clans…' })).toBeInTheDocument();
    expect(view.ui().getByText('Iron Wolves')).toBeInTheDocument();
    expect(view.ui().getByText('Harbor Crew')).toBeInTheDocument();
  });

  it('lets them search, but not join: Join is off with a hint, and their own clan says Joined', () => {
    const config = arena();
    const actions = { join: vi.fn() };
    const view = home(config, { actions });
    openFinder(view);

    expect(view.ui().getByText('Leave your clan to join another.')).toBeInTheDocument();
    expect(view.ui().getByRole('button', { name: 'Joined' })).toBeDisabled();
    view.ui().getAllByRole('button', { name: 'Join' }).forEach((join) => expect(join).toBeDisabled());
    expect(view.ui().getByRole('button', { name: 'Full' })).toBeDisabled();

    fireEvent.click(view.ui().getAllByRole('button', { name: 'Join' })[0]);

    expect(actions.join).not.toHaveBeenCalled();
  });

  it('has no create button for someone already in a clan', () => {
    const view = home(arena());

    openFinder(view);

    expect(view.ui().queryByRole('button', { name: /start a clan/i })).not.toBeInTheDocument();
  });

  it('filters the clans as they type, like the search for players without a clan', () => {
    const view = home(arena());
    openFinder(view);

    fireEvent.input(view.ui().getByRole('searchbox'), { target: { value: 'harbor' } });

    expect(view.ui().getByText('Harbor Crew').closest('.sk-row')).toHaveProperty('hidden', false);
    expect(view.ui().getByText('Iron Wolves').closest('.sk-row')).toHaveProperty('hidden', true);
  });

  it('goes back to Home', () => {
    const actions = { screenChanged: vi.fn() };
    const view = home(arena(), { actions });
    openFinder(view);

    fireEvent.click(view.ui().getByRole('button', { name: 'Back to clan' }));

    expect(actions.screenChanged).toHaveBeenLastCalledWith('home');
    expect(view.ui().getByRole('textbox', { name: 'Message…' })).toBeInTheDocument();
  });

  it('shows it when the host asks for the discover screen while the player is in a clan', () => {
    const config = arena();
    const view = mount(config, { ...createMockData(config), screen: 'discover', open: true });

    expect(view.ui().getByRole('button', { name: 'Back to clan' })).toBeInTheDocument();
    expect(view.ui().getByText('Leave your clan to join another.')).toBeInTheDocument();
  });

  it('is unchanged for a player without a clan: Join works and there is a create button', () => {
    const config = arena();
    const actions = { join: vi.fn() };
    const view = mount(config, { ...createMockData(config, { inClan: false }), screen: 'discover', open: true, actions });

    expect(view.ui().queryByRole('button', { name: 'Back to clan' })).not.toBeInTheDocument();
    expect(view.ui().queryByText('Leave your clan to join another.')).not.toBeInTheDocument();
    expect(view.ui().getByRole('button', { name: '+ Start a clan' })).toBeInTheDocument();

    fireEvent.click(view.ui().getAllByRole('button', { name: 'Join' })[0]);

    expect(actions.join).toHaveBeenCalledWith('clan-nova');
  });

  it('moves to the home screen when the player leaves while looking at other clans', () => {
    const config = arena();
    const data = { ...createMockData(config), screen: 'discover', open: true };
    const view = mount(config, data);

    view.handle.update(config, { ...createMockData(config, { inClan: false }), open: true });

    expect(view.ui().queryByRole('button', { name: 'Back to clan' })).not.toBeInTheDocument();
    expect(view.ui().getAllByRole('button', { name: 'Join' })[0]).not.toBeDisabled();
  });
});
