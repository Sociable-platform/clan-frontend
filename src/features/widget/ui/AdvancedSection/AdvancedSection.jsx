import { useId } from 'react';

import { CopyButton } from '@/shared/ui/CopyButton';
import { FormGroup } from '@/shared/ui/FormGroup';

import { WIDGET_LIMITS } from '../../config/widgetConfig';
import { formatKilobytes } from '../../utils/measureConfig';

/** The whole draft as JSON, read-only, for debugging. Editing happens in the other sections. */
export function AdvancedSection({ json, bytes }) {
  const textareaId = useId();
  const isOverLimit = bytes > WIDGET_LIMITS.MAX_CONFIG_BYTES;

  return (
    <FormGroup
      title="Raw JSON"
      description="The exact document that is saved. Read-only: change values in the other sections."
    >
      <div className="raw-meta">
        <span className={isOverLimit ? 'field-error' : 'field-hint'}>
          {formatKilobytes(bytes)} of {formatKilobytes(WIDGET_LIMITS.MAX_CONFIG_BYTES)}
          {isOverLimit ? ' - over the limit, the server will reject it' : ''}
        </span>
        <CopyButton value={json} label="Copy JSON" />
      </div>
      <label htmlFor={textareaId} className="visually-hidden">
        Draft config (read-only JSON)
      </label>
      <textarea
        id={textareaId}
        readOnly
        spellCheck={false}
        className="raw-json"
        rows={24}
        value={json}
      />
    </FormGroup>
  );
}
