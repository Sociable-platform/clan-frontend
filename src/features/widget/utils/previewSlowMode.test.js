import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COUNTDOWN_FROM_SECONDS, createSlowModePreview } from './previewSlowMode';

/** A stand-in for the widget's shadow root: a composer with a message box and a Send button. */
function mountComposer() {
  const root = document.createElement('div');
  root.innerHTML = '<div class="sk-composer"><input data-key="message" /><button type="button">Send</button></div>';
  document.body.append(root);
  return { root, button: root.querySelector('button'), input: root.querySelector('input') };
}

describe('createSlowModePreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('does nothing when slow mode is off', () => {
    const { root, button } = mountComposer();
    const slowMode = createSlowModePreview(() => root);

    slowMode.start(0);

    expect(slowMode.waiting()).toBe(false);
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent('Send');
  });

  it('only switches Send off for a short wait, with no countdown', () => {
    const { root, button } = mountComposer();
    const slowMode = createSlowModePreview(() => root);

    slowMode.start(COUNTDOWN_FROM_SECONDS - 1);

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Send');

    vi.advanceTimersByTime(3200);

    expect(button).toBeEnabled();
    slowMode.destroy();
  });

  it('counts a longer wait down on the button, then puts Send back', () => {
    const { root, button } = mountComposer();
    const slowMode = createSlowModePreview(() => root);

    slowMode.start(5);

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('5s');
    expect(button).toHaveAttribute('title', 'You can send again in 5s');

    vi.advanceTimersByTime(2200);
    expect(button).toHaveTextContent('3s');

    vi.advanceTimersByTime(3000);
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent('Send');
    expect(button).toHaveAttribute('title', '');
    slowMode.destroy();
  });

  it('keeps Enter from sending while the wait lasts', () => {
    const { root, input } = mountComposer();
    const sent = vi.fn();
    input.addEventListener('keydown', (event) => event.key === 'Enter' && sent());
    const slowMode = createSlowModePreview(() => root);
    const pressEnter = () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    slowMode.start(5);
    pressEnter();
    expect(sent).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5200);
    pressEnter();
    expect(sent).toHaveBeenCalledTimes(1);
    slowMode.destroy();
  });

  it('draws the wait again on a button the widget repainted', () => {
    const { root } = mountComposer();
    const slowMode = createSlowModePreview(() => root);
    slowMode.start(5);

    root.innerHTML = '<div class="sk-composer"><input data-key="message" /><button type="button">Send</button></div>';
    slowMode.decorate();

    expect(root.querySelector('button')).toBeDisabled();
    expect(root.querySelector('button')).toHaveTextContent('5s');
    slowMode.destroy();
  });
});
