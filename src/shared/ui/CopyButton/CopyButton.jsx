import { useEffect, useRef, useState } from 'react';

import { Icon } from '@/shared/ui/Icon';

const RESET_DELAY_MS = 2000;

const COPY_STATE = { IDLE: 'idle', COPIED: 'copied', FAILED: 'failed' };

/** Copies `value` to the clipboard. The result is announced through a status region. `withIcon` draws the copy icon before the label. */
export function CopyButton({ value, label = 'Copy', className = '', withIcon = false }) {
  const [copyState, setCopyState] = useState(COPY_STATE.IDLE);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleClick = async () => {
    let nextState = COPY_STATE.COPIED;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // No clipboard access (insecure origin, permission denied): the caller shows the
      // value in selectable text, so the person can still copy it by hand.
      nextState = COPY_STATE.FAILED;
    }
    setCopyState(nextState);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopyState(COPY_STATE.IDLE), RESET_DELAY_MS);
  };

  const buttonText = copyState === COPY_STATE.COPIED ? 'Copied' : label;

  return (
    <>
      <button
        type="button"
        className={`button button-secondary ${withIcon ? 'button-with-icon' : ''} ${className}`.replace(/\s+/g, ' ').trim()}
        onClick={handleClick}
      >
        {withIcon ? <Icon name="copy" /> : null}
        {buttonText}
      </button>
      <span role="status" className="visually-hidden">
        {copyState === COPY_STATE.COPIED ? 'Copied to clipboard' : ''}
        {copyState === COPY_STATE.FAILED ? 'Could not copy. Select the text and copy it manually.' : ''}
      </span>
      {copyState === COPY_STATE.FAILED ? (
        <span className="field-error" aria-hidden="true">
          Could not copy. Select the text and copy it manually.
        </span>
      ) : null}
    </>
  );
}
