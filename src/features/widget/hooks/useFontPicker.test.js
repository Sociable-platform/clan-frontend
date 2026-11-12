import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ALL_FONTS, FONT_ROLES, useFontPicker } from './useFontPicker';

describe('useFontPicker', () => {
  it('starts on headings with every font', () => {
    const { result } = renderHook(() => useFontPicker());

    expect(result.current.role).toBe(FONT_ROLES.HEADING);
    expect(result.current.category).toBe(ALL_FONTS);
    expect(result.current.fonts).toHaveLength(43);
  });

  it('filters by category', () => {
    const { result } = renderHook(() => useFontPicker());

    act(() => result.current.handleCategoryChange('Pixel'));

    expect(result.current.fonts.map((font) => font.family)).toEqual(['Press Start 2P', 'VT323', 'Silkscreen', 'Pixelify Sans']);
  });

  it('searches names and categories, ignoring case, together with the category', () => {
    const { result } = renderHook(() => useFontPicker());

    act(() => result.current.handleQueryChange('  ORBIT '));
    expect(result.current.fonts.map((font) => font.family)).toEqual(['Orbitron']);

    act(() => result.current.handleQueryChange('sci-fi'));
    expect(result.current.fonts).toHaveLength(7);

    act(() => result.current.handleCategoryChange('Mono'));
    expect(result.current.fonts).toEqual([]);
  });
});
