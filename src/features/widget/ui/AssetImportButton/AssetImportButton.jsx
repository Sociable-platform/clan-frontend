import { useId, useRef } from 'react';

/** A button that opens the file picker for one image. The real input is visually hidden but keyboard-focusable. */
export function AssetImportButton({ label, accept, hint, onFile, isBusy = false }) {
  const hintId = useId();
  const inputRef = useRef(null);

  const handleChange = async (event) => {
    const [file] = event.target.files;
    if (file) await onFile(file);
    // Clear the input so choosing the same file again still fires a change.
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="asset-import">
      <label className="button button-secondary asset-import-button">
        <input
          ref={inputRef}
          type="file"
          className="visually-hidden"
          accept={accept}
          aria-describedby={hintId}
          disabled={isBusy}
          onChange={handleChange}
        />
        {label}
      </label>
      <span id={hintId} className="asset-import-hint">
        {hint}
      </span>
    </div>
  );
}
