import { useId } from 'react';

import { CopyButton } from '@/shared/ui/CopyButton';

import { WIDGET_LIMITS } from '../../config/widgetConfig';
import { formatKilobytes } from '../../utils/measureConfig';

/**
 * The whole draft as JSON, read-only, for debugging. Editing happens in the panels around it. The JSON is
 * wrapped in a `config` envelope like the platform API's body. It shows the size against the limit and how many fields the server is complaining about. The
 * same panel shows an old version (`heading`, `note` and `actions` say which and what to do).
 */
export function ConfigPanel({
  json,
  bytes,
  schemaVersion,
  problemCount = 0,
  heading = 'Experience config',
  note = null,
  actions = null,
}) {
  const headingId = useId();
  const textareaId = useId();
  const isOverLimit = bytes > WIDGET_LIMITS.MAX_CONFIG_BYTES;

  return (
    <section aria-labelledby={headingId} className="studio-card">
      <header className="studio-card-header">
        <h2 id={headingId} className="studio-card-title">
          {heading}
        </h2>
        <span className="chip-static">schemaVersion {schemaVersion}</span>
        {problemCount > 0 ? (
          <span className="chip-static chip-static-error">{`${problemCount} ${problemCount === 1 ? 'problem' : 'problems'}`}</span>
        ) : null}
        <span className={isOverLimit ? 'studio-card-note field-error' : 'studio-card-note'}>
          {formatKilobytes(bytes)} of {formatKilobytes(WIDGET_LIMITS.MAX_CONFIG_BYTES)}
          {isOverLimit ? ' · over the limit' : ''}
        </span>
        {note ? <span className="studio-card-note">{note}</span> : null}
        <span className="studio-card-note studio-card-note-end">
          In a {'{ config }'} envelope like the API · size counts the config · data only · unknown fields rejected
        </span>
        {actions}
        <CopyButton value={json} label="Copy JSON" />
      </header>
      <label htmlFor={textareaId} className="visually-hidden">
        Draft config (read-only JSON)
      </label>
      <textarea id={textareaId} readOnly spellCheck={false} className="raw-json" rows={18} value={json} />
    </section>
  );
}
