import { describe, expect, it } from 'vitest';

import { contrastRatio, MIN_TEXT_CONTRAST, readableTextOn } from './contrast';

describe('contrast', () => {
  it('gives 21 for black on white and 1 for the same colour', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#80EAFF', '#80EAFF')).toBeCloseTo(1, 5);
  });

  it('matches the Studio design for its default dark palette', () => {
    expect(contrastRatio('#E8ECED', '#141D1F')).toBeCloseTo(14.4, 1);
    expect(contrastRatio('#80EAFF', '#14161B')).toBeCloseTo(13.0, 0);
  });

  it('does not care about the order or the case of the hex', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(contrastRatio('#000000', '#FFFFFF'), 5);
  });

  it('returns null for something that is not a hex colour', () => {
    expect(contrastRatio('#FFF', '#000000')).toBeNull();
    expect(contrastRatio(undefined, '#000000')).toBeNull();
  });

  it('picks the text colour that reads better on a background', () => {
    expect(readableTextOn('#80EAFF')).toBe('#14161B');
    expect(readableTextOn('#141D1F')).toBe('#FFFFFF');
    expect(MIN_TEXT_CONTRAST).toBe(4.5);
  });
});
