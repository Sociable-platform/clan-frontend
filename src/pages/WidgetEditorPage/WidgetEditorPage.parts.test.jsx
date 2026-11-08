import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listGames } from '@/features/games/api/gamesApi';
import { getWidgetDraft, listWidgetVersions, saveWidgetDraft } from '@/features/widget/api/widgetApi';
import { buildGame, buildWidgetConfig } from '@/test/builders';
import { renderWithRouter } from '@/test/renderWithRouter';

import { WidgetEditorPage } from './WidgetEditorPage';

vi.mock('@/features/widget/api/widgetApi');
vi.mock('@/features/games/api/gamesApi');

const renderEditor = () =>
  renderWithRouter([{ path: '/games/:gameId/widget', element: <WidgetEditorPage /> }], { initialEntries: ['/games/g1/widget'] });

const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const rawConfig = () => JSON.parse(screen.getByLabelText('Draft config (read-only JSON)').value);
const components = () => rawConfig().theme.components;
const panelVars = () => document.querySelector('[data-clan-ui]').shadowRoot.querySelector('.sk-root').style;
const group = (name) => within(screen.getByRole('region', { name }));
const styleTabs = async () => within(await screen.findByRole('tablist', { name: 'Style' }));
const pressedChip = () => document.querySelector('.preview-screens .chip[aria-pressed="true"]').textContent;
const chip = (name) => screen.getByRole('button', { name: new RegExp(`^${name}`) });
const customize = async (user, name) => user.click(group(name).getByRole('switch', { name: `Customize ${name}` }));

/** Each part lives in the Style tab named after the part of the widget it styles. */
async function openStyleTab(user, name) {
  await user.click((await styleTabs()).getByRole('tab', { name }));
}

async function replaceValue(user, field, value) {
  await user.clear(field);
  await user.type(field, value);
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.resetAllMocks();
  window.localStorage.clear();
  listGames.mockResolvedValue([buildGame({ id: 'g1', name: 'Space Raiders' })]);
  getWidgetDraft.mockResolvedValue(buildWidgetConfig());
  saveWidgetDraft.mockResolvedValue(undefined);
  listWidgetVersions.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Style panel structure', () => {
  it('has General first and one tab per part of the widget', async () => {
    renderEditor();

    const tabs = await styleTabs();

    expect(tabs.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['General', 'Panel', 'Messages', 'Buttons', 'Tabs', 'Lists']);
    expect(tabs.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps the settings that restyle everything in General', async () => {
    renderEditor();

    expect(await screen.findByRole('group', { name: 'Color mode' })).toBeInTheDocument();
    expect(screen.getByLabelText('Brand')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Corners' })).toBeInTheDocument();
    expect(screen.getByText('43 fonts · picking for headings')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Frame style' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Chat layout' })).not.toBeInTheDocument();
  });

  it('puts each part\'s own settings in its tab', async () => {
    const user = setupUser();
    renderEditor();

    await openStyleTab(user, 'Panel');
    expect(screen.getByRole('group', { name: 'Frame style' })).toBeInTheDocument();
    expect(screen.getByLabelText('Frame width')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Blur the game behind' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Panel frame texture' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Content area texture' })).toBeInTheDocument();

    await openStyleTab(user, 'Messages');
    expect(screen.getByRole('group', { name: 'Chat layout' })).toBeInTheDocument();
    expect(group('My messages').getByRole('switch', { name: 'Customize My messages' })).toBeInTheDocument();
    expect(group("Other players' messages").getByRole('switch')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Chat bubbles texture' })).toBeInTheDocument();

    await openStyleTab(user, 'Buttons');
    expect(screen.getByRole('group', { name: 'Button style' })).toBeInTheDocument();
    expect(group('Main buttons').getByRole('switch')).toBeInTheDocument();
    expect(group('Outline buttons').getByRole('switch')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Buttons texture' })).toBeInTheDocument();

    await openStyleTab(user, 'Tabs');
    expect(group('Tab bar').getByRole('switch')).toBeInTheDocument();
    expect(group('Selected tab').getByRole('switch')).toBeInTheDocument();

    await openStyleTab(user, 'Lists');
    expect(group('Rows and cards').getByRole('switch')).toBeInTheDocument();
  });
});

describe('customizing a part', () => {
  it('has no fields until a part is switched on, and nothing in the draft', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Messages');

    expect(group('My messages').getByRole('switch', { name: 'Customize My messages' })).not.toBeChecked();
    expect(screen.queryByRole('combobox', { name: 'Border style' })).not.toBeInTheDocument();
    expect(components()).toBeUndefined();
  });

  it('starts from what the theme gives it, so nothing changes by itself', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Messages');

    await customize(user, 'My messages');

    expect(components().bubbleMine).toEqual({ background: '#80EAFF', text: '#14161B', borderStyle: 'none', borderWidth: 1, borderColor: '#2C3B3E', radius: 6 });
    expect(group('My messages').getByRole('combobox', { name: 'Border style' })).toHaveValue('none');
    expect(group('My messages').getByText(/Text on background/)).toBeInTheDocument();
  });

  it('changes the border and the corners of a part and shows it in the preview at once', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Lists');
    await customize(user, 'Rows and cards');

    await user.selectOptions(group('Rows and cards').getByRole('combobox', { name: 'Border style' }), 'double');
    await replaceValue(user, group('Rows and cards').getByRole('spinbutton', { name: 'Border width' }), '4');
    await replaceValue(user, group('Rows and cards').getByRole('spinbutton', { name: 'Corner radius' }), '12');

    expect(components().row).toMatchObject({ borderStyle: 'double', borderWidth: 4, radius: 12 });
    expect(panelVars().getPropertyValue('--sk-row-border-style')).toBe('double');
    expect(panelVars().getPropertyValue('--sk-row-border-width')).toBe('4px');
    expect(panelVars().getPropertyValue('--sk-row-radius')).toBe('12px');
  });

  it('changes the colors of a part', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Tabs');
    await customize(user, 'Selected tab');

    await replaceValue(user, group('Selected tab').getByRole('textbox', { name: 'Background' }), '#F5A524');

    expect(components().tabSelected.background).toBe('#F5A524');
    expect(panelVars().getPropertyValue('--sk-tab-on-bg')).toBe('#F5A524');
  });

  it('warns when the text of a part is hard to read on its background', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Buttons');
    await customize(user, 'Main buttons');

    await replaceValue(user, group('Main buttons').getByRole('textbox', { name: 'Text' }), '#81EBFF');

    expect(group('Main buttons').getByText(/low contrast/)).toBeInTheDocument();
  });

  it('customizes parts independently of each other, within a tab and across tabs', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Messages');

    await customize(user, 'My messages');
    await customize(user, "Other players' messages");
    await replaceValue(user, group('My messages').getByRole('spinbutton', { name: 'Corner radius' }), '20');
    await openStyleTab(user, 'Buttons');
    await customize(user, 'Outline buttons');

    expect(components().bubbleMine.radius).toBe(20);
    expect(components().bubbleTheirs.radius).toBe(6);
    expect(Object.keys(components()).sort()).toEqual(['bubbleMine', 'bubbleTheirs', 'buttonSecondary']);
  });

  it('goes back to following the theme when a part is switched off, and drops the section when none is left', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Tabs');
    await customize(user, 'Tab bar');
    await openStyleTab(user, 'Lists');
    await customize(user, 'Rows and cards');
    await openStyleTab(user, 'Tabs');

    await customize(user, 'Tab bar');

    expect(Object.keys(components())).toEqual(['row']);

    await openStyleTab(user, 'Lists');
    await customize(user, 'Rows and cards');

    expect(components()).toBeUndefined();
    expect(panelVars().getPropertyValue('--sk-row-bg')).toBe('');
  });

  it('opens an existing config with its parts already customized, in the right tab', async () => {
    getWidgetDraft.mockResolvedValue(
      buildWidgetConfig((draft) => {
        draft.theme.components = { bubbleMine: { radius: 0, borderStyle: 'bevel', borderWidth: 3 } };
      }),
    );
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Messages');

    expect(group('My messages').getByRole('switch', { name: 'Customize My messages' })).toBeChecked();
    expect(group('My messages').getByRole('combobox', { name: 'Border style' })).toHaveValue('bevel');
    expect(group('My messages').getByRole('spinbutton', { name: 'Corner radius' })).toHaveValue(0);
    expect(group('My messages').getByRole('textbox', { name: 'Background' })).toHaveValue('#80EAFF');
    expect(group("Other players' messages").getByRole('switch')).not.toBeChecked();
  });
});

describe('the preview follows the Style tab', () => {
  it('opens the preview on a screen where the tab\'s parts can be seen', async () => {
    const user = setupUser();
    renderEditor();

    await openStyleTab(user, 'Lists');

    expect(pressedChip()).toMatch(/^Members/);

    await openStyleTab(user, 'Messages');

    expect(pressedChip()).toMatch(/^Home/);
  });

  it('takes the preview to the screen of a part when it is switched on', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Buttons');

    expect(pressedChip()).toMatch(/^Home/);

    await customize(user, 'Outline buttons');

    expect(pressedChip()).toMatch(/^Friends/);
  });

  it('brings it back with Show in preview after looking at another screen', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Lists');
    await customize(user, 'Rows and cards');
    await user.click(chip('Discover'));

    expect(pressedChip()).toMatch(/^Discover/);

    await user.click(group('Rows and cards').getByRole('button', { name: 'Show Rows and cards in preview' }));

    expect(pressedChip()).toMatch(/^Members/);

    await user.click(chip('Home'));
    await user.click(group('Rows and cards').getByRole('button', { name: 'Show Rows and cards in preview' }));

    expect(pressedChip()).toMatch(/^Members/);
  });

  it('says where the part is seen, and only offers the button once the part is customized', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Buttons');

    expect(screen.queryByRole('button', { name: /in preview$/ })).not.toBeInTheDocument();

    await customize(user, 'Main buttons');

    expect(group('Main buttons').getByText('Seen in the preview on Home & chat.')).toBeInTheDocument();
  });

  it('shows the edit on the screen it jumped to', async () => {
    const user = setupUser();
    renderEditor();
    await openStyleTab(user, 'Lists');
    await customize(user, 'Rows and cards');

    await replaceValue(user, group('Rows and cards').getByRole('textbox', { name: 'Background' }), '#778899');

    const memberRow = document.querySelector('[data-clan-ui]').shadowRoot.querySelector('.sk-row');
    expect(getComputedStyle(memberRow).backgroundColor).toBe('rgb(119, 136, 153)');
  });
});
