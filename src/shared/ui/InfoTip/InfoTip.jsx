import { useEffect, useId, useRef, useState } from 'react';

/**
 * A small "?" button that shows a short explanation next to a heading or a label.
 *
 * Click or tap opens it. Clicking it again, clicking anywhere else or pressing Escape closes it, and
 * Escape gives focus back to the button. It is not a hover tooltip on purpose: touch screens have no
 * hover, and the text stays readable for as long as the person needs it.
 *
 * `label` names the button for screen readers ("About the preview"). `children` is the explanation;
 * it may contain lists or paragraphs, so do not place an InfoTip inside a <p>.
 */
export function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const bubbleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="info-tip">
      <button
        ref={buttonRef}
        type="button"
        className="info-tip-button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={bubbleId}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        ?
      </button>
      <div id={bubbleId} className="info-tip-bubble" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
