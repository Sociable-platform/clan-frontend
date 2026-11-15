import { describe, expect, it } from 'vitest';

import { createDraftHistory } from './draftHistory';

/** A history with a clock the test moves by hand. */
function createHistory(options) {
  let time = 0;
  const history = createDraftHistory({ ...options, now: () => time });
  return { history, wait: (ms) => (time += ms) };
}

describe('createDraftHistory', () => {
  it('starts with nothing to undo or redo', () => {
    const { history } = createHistory();

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.undo('now')).toBeNull();
    expect(history.redo('now')).toBeNull();
  });

  it('goes back one edit at a time, and forward again', () => {
    const { history, wait } = createHistory();
    history.record('v1', '/a');
    wait(2000);
    history.record('v2', '/b');

    expect(history.undo('v3')).toBe('v2');
    expect(history.undo('v2')).toBe('v1');
    expect(history.canUndo()).toBe(false);

    expect(history.redo('v1')).toBe('v2');
    expect(history.redo('v2')).toBe('v3');
    expect(history.canRedo()).toBe(false);
  });

  it('drops the undone steps when a new edit is made', () => {
    const { history, wait } = createHistory();
    history.record('v1', '/a');
    history.undo('v2');
    wait(2000);

    history.record('v1', '/b');

    expect(history.canRedo()).toBe(false);
    expect(history.undo('v3')).toBe('v1');
  });

  it('counts quick edits of one field as one step, like typing', () => {
    const { history, wait } = createHistory();
    history.record('', '/title');
    wait(200);
    history.record('H', '/title');
    wait(200);
    history.record('Hu', '/title');

    expect(history.undo('Hub')).toBe('');
    expect(history.canUndo()).toBe(false);
  });

  it('counts a slow second edit of the same field as a step of its own', () => {
    const { history, wait } = createHistory();
    history.record(1, '/count');
    wait(5000);
    history.record(2, '/count');

    expect(history.undo(3)).toBe(2);
    expect(history.undo(2)).toBe(1);
  });

  it('counts quick edits of different fields as separate steps', () => {
    const { history, wait } = createHistory();
    history.record('v1', '/a');
    wait(300);
    history.record('v2', '/b');

    expect(history.undo('v3')).toBe('v2');
    expect(history.undo('v2')).toBe('v1');
  });

  it('counts fields changed by one action as one step', () => {
    const { history } = createHistory();
    history.record('v1', '/theme/mode');
    history.record('v2', '/theme/colors');

    expect(history.undo('v3')).toBe('v1');
    expect(history.canUndo()).toBe(false);
  });

  it('does not join an edit to the one before an undo', () => {
    const { history, wait } = createHistory();
    history.record('v1', '/a');
    wait(100);
    history.undo('v2');
    wait(100);
    history.record('v1', '/a');

    expect(history.undo('v2b')).toBe('v1');
  });

  it('keeps only the newest steps', () => {
    const { history, wait } = createHistory({ limit: 2 });
    ['v1', 'v2', 'v3'].forEach((version) => {
      history.record(version, '/a');
      wait(2000);
    });

    expect(history.undo('v4')).toBe('v3');
    expect(history.undo('v3')).toBe('v2');
    expect(history.undo('v2')).toBeNull();
  });
});
