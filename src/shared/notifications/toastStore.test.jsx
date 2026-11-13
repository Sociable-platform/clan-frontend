import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearToasts, dismissToast, showToast, TOAST_DURATION_MS, useToasts } from './toastStore';

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    clearToasts();
    vi.useRealTimers();
  });

  it('adds a success toast that a mounted component sees', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      showToast({ message: 'Developer suspended' });
    });

    expect(result.current).toEqual([
      expect.objectContaining({ message: 'Developer suspended', tone: 'success' }),
    ]);
  });

  it('keeps toasts in the order they were shown', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      showToast({ message: 'First' });
      showToast({ message: 'Second', tone: 'error' });
    });

    expect(result.current.map((toast) => toast.message)).toEqual(['First', 'Second']);
  });

  it('removes a toast by itself after the duration', () => {
    const { result } = renderHook(() => useToasts());
    act(() => {
      showToast({ message: 'Gone soon' });
    });

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS);
    });

    expect(result.current).toEqual([]);
  });

  it('removes one toast when dismissed and leaves the others', () => {
    const { result } = renderHook(() => useToasts());
    let firstId;
    act(() => {
      firstId = showToast({ message: 'First' });
      showToast({ message: 'Second' });
    });

    act(() => {
      dismissToast(firstId);
    });

    expect(result.current.map((toast) => toast.message)).toEqual(['Second']);
  });
});
