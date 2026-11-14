import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFontPicker } from './useFontPicker';

describe('useFontPicker', () => {
  it('starts with every font', () => {
    const { result } = renderHook(() => useFontPicker());

    expect(result.current.query).toBe('');
    expect(result.current.fonts).toHaveLength(43);
  });

  it('finds a whole category by its name', () => {
    const { result } = renderHook(() => useFontPicker());

    act(() => result.current.handleQueryChange('pixel'));

    expect(result.current.fonts.map((font) => font.family)).toEqual(['Press Start 2P', 'VT323', 'Silkscreen', 'Pixelify Sans']);
  });

  it('searches names and categories, ignoring case', () => {
    const { result } = renderHook(() => useFontPicker());

    act(() => result.current.handleQueryChange('  ORBIT '));
    expect(result.current.fonts.map((font) => font.family)).toEqual(['Orbitron']);

    act(() => result.current.handleQueryChange('sci-fi'));
    expect(result.current.fonts).toHaveLength(7);

    act(() => result.current.handleQueryChange('zzz'));
    expect(result.current.fonts).toEqual([]);
  });

  it('starts over on reset', () => {
    const { result } = renderHook(() => useFontPicker());

    act(() => result.current.handleQueryChange('orbit'));
    act(() => result.current.reset());

    expect(result.current.query).toBe('');
    expect(result.current.fonts).toHaveLength(43);
  });
});
