/**
 * Slow mode in the preview, shown the way the SDK shows it in a game: after a message is sent the
 * Send button is off for `chat.slowModeSeconds`, and from COUNTDOWN_FROM_SECONDS up it counts the
 * wait down ("5s", "4s", ...). Below that the wait is over about as fast as a number can be read,
 * so the button is only off. Zero seconds means no wait at all.
 *
 * The widget itself (`@clan/ui`) does not know about slow mode: in a game the server enforces it and
 * the SDK decorates the button. The preview has no server, so this does the same decoration here.
 */

/** Keep in step with COUNTDOWN_FROM_SECONDS in clan-sdk (src/chat/controller.js). */
export const COUNTDOWN_FROM_SECONDS = 4;

const TICK_MS = 200;

/**
 * `getRoot` returns the widget's shadow root (or nothing while it is not mounted). Returns
 * `start(seconds)` to begin a wait after a sent message, `waiting()`, `decorate()` to draw the
 * current state on the Send button again after the widget repainted, and `destroy()`.
 */
export function createSlowModePreview(getRoot, now = Date.now) {
  let until = 0;
  let countdown = false;
  let timer = null;
  let observer = null;
  let guarded = null;

  const waiting = () => until > now();

  // Enter in the message box sends too, so it is stopped while the wait lasts: the draft stays.
  const blockEnter = (event) => {
    if (event.key === 'Enter' && waiting() && event.target?.matches?.('[data-key="message"]')) event.stopPropagation();
  };

  function decorate() {
    const button = getRoot()?.querySelector('.sk-composer button');
    if (!button) return;
    // The label the widget drew is remembered once, so it can be put back when the wait is over.
    if (button.dataset.previewLabel === undefined) button.dataset.previewLabel = button.textContent;
    const active = waiting();
    const left = Math.max(0, Math.ceil((until - now()) / 1000));
    const label = active && countdown ? `${left}s` : button.dataset.previewLabel;
    const title = active && countdown ? `You can send again in ${left}s` : '';
    // Only write a changed value: the observer below watches this tree, and an unconditional write would loop.
    if (button.textContent !== label) button.textContent = label;
    if (button.disabled !== active) button.disabled = active;
    if (button.title !== title) button.title = title;
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    observer?.disconnect();
    observer = null;
    until = 0;
    decorate();
  }

  function start(seconds) {
    const root = getRoot();
    if (!root || !(seconds > 0)) return;
    until = now() + seconds * 1000;
    countdown = seconds >= COUNTDOWN_FROM_SECONDS;

    if (guarded !== root) {
      guarded?.removeEventListener('keydown', blockEnter, true);
      root.addEventListener('keydown', blockEnter, true);
      guarded = root;
    }
    // The widget repaints on its own (a tab change, a new message): draw the wait on the new button too.
    observer?.disconnect();
    observer = new MutationObserver(decorate);
    observer.observe(root, { childList: true, subtree: true });
    clearInterval(timer);
    timer = setInterval(() => (waiting() ? decorate() : stop()), TICK_MS);
    decorate();
  }

  function destroy() {
    clearInterval(timer);
    observer?.disconnect();
    guarded?.removeEventListener('keydown', blockEnter, true);
    timer = null;
    observer = null;
    guarded = null;
    until = 0;
  }

  return { start, waiting, decorate, destroy };
}
