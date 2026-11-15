import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useUndoShortcuts } from './useUndoShortcuts';

function setup(options = {}) {
  const onUndo = vi.fn();
  const onRedo = vi.fn();
  renderHook(() => useUndoShortcuts({ onUndo, onRedo, ...options }));
  return { onUndo, onRedo };
}

describe('useUndoShortcuts', () => {
  it('undoes on Ctrl+Z and on Cmd+Z', () => {
    const { onUndo, onRedo } = setup();

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: 'z', metaKey: true });

    expect(onUndo).toHaveBeenCalledTimes(2);
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('redoes on Ctrl+Shift+Z and on Ctrl+Y', () => {
    const { onUndo, onRedo } = setup();

    fireEvent.keyDown(document.body, { key: 'Z', ctrlKey: true, shiftKey: true });
    fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true });

    expect(onRedo).toHaveBeenCalledTimes(2);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('ignores a plain z and other shortcuts', () => {
    const { onUndo, onRedo } = setup();

    fireEvent.keyDown(document.body, { key: 'z' });
    fireEvent.keyDown(document.body, { key: 's', ctrlKey: true });

    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('leaves Ctrl+Z to the browser while typing in a text box', () => {
    const { onUndo } = setup();
    render(
      <>
        <input aria-label="Title" type="text" />
        <textarea aria-label="Notes" />
      </>,
    );

    fireEvent.keyDown(screen.getByLabelText('Title'), { key: 'z', ctrlKey: true });
    fireEvent.keyDown(screen.getByLabelText('Notes'), { key: 'z', ctrlKey: true });

    expect(onUndo).not.toHaveBeenCalled();
  });

  it('still undoes when the focus is on a switch or a button', () => {
    const { onUndo } = setup();
    render(
      <>
        <input aria-label="Clan chat" type="checkbox" />
        <button type="button">Add role</button>
      </>,
    );

    fireEvent.keyDown(screen.getByLabelText('Clan chat'), { key: 'z', ctrlKey: true });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Add role' }), { key: 'z', ctrlKey: true });

    expect(onUndo).toHaveBeenCalledTimes(2);
  });

  it('does nothing when switched off', () => {
    const { onUndo } = setup({ isEnabled: false });

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });

    expect(onUndo).not.toHaveBeenCalled();
  });
});
