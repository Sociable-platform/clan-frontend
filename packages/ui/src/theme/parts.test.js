import { describe, expect, it } from 'vitest';

import { loadExample, mount } from '../testUtils.js';
import { createMockData } from '../data/mockData.js';
import { resolveTheme } from './theme.js';

const withParts = (components) => {
  const config = loadExample('valid/arena.json');
  config.theme.components = components;
  return resolveTheme(config).vars;
};
const varsOf = (vars, prefix) => Object.fromEntries(Object.entries(vars).filter(([name]) => name.startsWith(`--sk-${prefix}-`)));

describe('component styles (theme.components)', () => {
  it('sets nothing for a theme without them, so every part keeps its look', () => {
    const vars = resolveTheme(loadExample('valid/arena.json')).vars;

    expect(Object.keys(vars).filter((name) => /^--sk-(bubble|btn2|tab|row)-/.test(name))).toEqual([]);
    expect(Object.keys(vars)).not.toContain('--sk-btn-radius');
    expect(Object.keys(vars)).not.toContain('--sk-btn-border-style');
  });

  it('turns a part into its own variables: colors, border and radius', () => {
    const vars = withParts({ bubbleMine: { background: '#2E8B57', text: '#FFFFFF', borderStyle: 'solid', borderWidth: 2, borderColor: '#1F5E3B', radius: 16 } });

    expect(varsOf(vars, 'bubble-mine')).toEqual({
      '--sk-bubble-mine-bg': '#2E8B57',
      '--sk-bubble-mine-fg': '#FFFFFF',
      '--sk-bubble-mine-border-style': 'solid',
      '--sk-bubble-mine-border-width': '2px',
      '--sk-bubble-mine-border-color': '#1F5E3B',
      '--sk-bubble-mine-radius': '16px',
      '--sk-bubble-mine-clip': 'none',
    });
    expect(varsOf(vars, 'bubble-theirs')).toEqual({});
  });

  it.each([
    ['bubbleTheirs', 'bubble-theirs'],
    ['button', 'btn'],
    ['buttonSecondary', 'btn2'],
    ['tab', 'tab'],
    ['tabSelected', 'tab-on'],
    ['row', 'row'],
  ])('maps %s to the %s variables', (part, prefix) => {
    expect(varsOf(withParts({ [part]: { background: '#112233' } }), prefix)[`--sk-${prefix}-bg`]).toBe('#112233');
  });

  it('overrides the main button: its own colors win over the theme button style', () => {
    const vars = withParts({ button: { background: '#F5A524', text: '#14161B' } });

    expect(vars['--sk-btn-bg']).toBe('#F5A524');
    expect(vars['--sk-btn-fg']).toBe('#14161B');
  });

  it('draws a border as soon as one of its fields is set, with the theme defaults for the rest', () => {
    expect(varsOf(withParts({ row: { borderWidth: 3 } }), 'row')).toEqual({
      '--sk-row-border-style': 'solid',
      '--sk-row-border-width': '3px',
      '--sk-row-border-color': '#2C3B3E',
    });
    expect(varsOf(withParts({ row: { borderColor: '#ABCDEF' } }), 'row')['--sk-row-border-width']).toBe('1px');
  });

  it('draws bevel and inset borders with four edge colors and "none" as no border', () => {
    expect(withParts({ row: { borderStyle: 'bevel', borderColor: '#808080' } })['--sk-row-border-color'].split(' ')).toHaveLength(4);
    expect(varsOf(withParts({ row: { borderStyle: 'none', borderWidth: 4 } }), 'row')).toMatchObject({ '--sk-row-border-style': 'none', '--sk-row-border-width': '0px' });
  });

  it('keeps a radius of 0 (square) and clamps the rest into range', () => {
    expect(withParts({ row: { radius: 0 } })['--sk-row-radius']).toBe('0px');
    expect(withParts({ row: { radius: 99 } })['--sk-row-radius']).toBe('24px');
    expect(withParts({ row: { radius: -5 } })['--sk-row-radius']).toBe('0px');
    expect(withParts({ row: { radius: 7.6 } })['--sk-row-radius']).toBe('8px');
  });

  it('ignores a bad value instead of passing it on', () => {
    const vars = withParts({ row: { background: 'url(x)', text: '#12', borderStyle: 'dashed', borderWidth: 'wide', borderColor: 'red', radius: 'round' } });

    expect(varsOf(vars, 'row')).toEqual({
      '--sk-row-border-style': 'solid',
      '--sk-row-border-width': '1px',
      '--sk-row-border-color': '#2C3B3E',
    });
  });

  it('ignores a part that is not an object, and parts it does not know', () => {
    expect(varsOf(withParts({ row: 'big', tab: null, header: { background: '#FFFFFF' } }), 'row')).toEqual({});
  });

  it('reaches the mounted panel', () => {
    const config = loadExample('valid/styled-parts.json');
    const { root } = mount(config, { ...createMockData(config), open: true });

    expect(root().style.getPropertyValue('--sk-tab-on-bg')).toBe('#F5A524');
    expect(root().style.getPropertyValue('--sk-bubble-theirs-border-style')).toBe('double');
    expect(root().style.getPropertyValue('--sk-row-radius')).toBe('8px');
  });

  it('forgets a part\'s variables when it is switched back to the theme', () => {
    const config = loadExample('valid/arena.json');
    config.theme.components = { row: { background: '#26363A', radius: 3 } };
    const { handle, root } = mount(config, { ...createMockData(config), open: true });

    expect(root().style.getPropertyValue('--sk-row-bg')).toBe('#26363A');

    delete config.theme.components;
    handle.update(config, { ...createMockData(config), open: true });

    expect(root().style.getPropertyValue('--sk-row-bg')).toBe('');
    expect(root().style.getPropertyValue('--sk-row-radius')).toBe('');
    expect(root().style.getPropertyValue('--sk-brand')).not.toBe('');
  });
});
