import { describe, expect, it } from 'vitest';

import { PARTS } from '../config/widgetParts';
import { buildWidgetConfig } from '@/test/builders';
import { effectivePart, seedPartStyle } from './partStyles';

const theme = (change) => buildWidgetConfig(change).theme;

describe('seedPartStyle', () => {
  it('starts every part from what the theme gives it', () => {
    const arena = theme();

    expect(seedPartStyle('bubbleMine', arena)).toMatchObject({ background: '#80EAFF', text: '#14161B', borderStyle: 'none', radius: 6 });
    expect(seedPartStyle('bubbleTheirs', arena)).toMatchObject({ background: '#1B2628', text: '#E8ECED' });
    expect(seedPartStyle('buttonSecondary', arena)).toMatchObject({ borderStyle: 'solid', borderColor: '#2C3B3E' });
    expect(seedPartStyle('tab', arena)).toMatchObject({ background: '#141D1F', text: '#B7C5C8' });
    expect(seedPartStyle('tabSelected', arena)).toMatchObject({ background: '#80EAFF' });
    expect(seedPartStyle('row', arena)).toMatchObject({ background: '#1B2628' });
  });

  it('gives a part every field, and only the ones the schema knows', () => {
    PARTS.forEach((part) => {
      expect(Object.keys(seedPartStyle(part.key, theme())).sort()).toEqual(['background', 'borderColor', 'borderStyle', 'borderWidth', 'radius', 'text']);
    });
  });

  it('follows the corner style, the colors and the mode', () => {
    expect(seedPartStyle('row', theme((c) => (c.theme.frame.corners = 'square'))).radius).toBe(0);
    expect(seedPartStyle('row', theme((c) => (c.theme.frame.corners = 'round'))).radius).toBe(14);
    expect(seedPartStyle('row', theme((c) => (c.theme.frame.corners = 'chamfer'))).radius).toBe(0);
    expect(seedPartStyle('button', theme((c) => (c.theme.colors.brand = '#2F6BFF'))).text).toBe('#FFFFFF');
    expect(seedPartStyle('row', theme((c) => (c.theme.mode = 'light'))).borderColor).toBe('#D9DBD5');
  });
});

describe('effectivePart', () => {
  it('shows the part\'s own values and the theme\'s for what it leaves out', () => {
    const seed = seedPartStyle('row', theme());

    expect(effectivePart({ radius: 3 }, seed)).toEqual({ ...seed, radius: 3 });
    expect(effectivePart({}, seed)).toEqual(seed);
  });
});
