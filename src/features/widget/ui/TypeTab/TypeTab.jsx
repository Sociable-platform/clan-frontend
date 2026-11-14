import { useState } from 'react';

import { FieldError } from '@/shared/ui/FieldError';
import { FormGroup } from '@/shared/ui/FormGroup';

import { FONT_ROLES } from '../../hooks/useFontPicker';
import { FontDropdown } from '../FontDropdown';

const FONT_FIELDS = [
  { role: FONT_ROLES.HEADING, label: 'Headings', path: '/theme/fonts/heading/family', errorId: 'heading-font-error' },
  { role: FONT_ROLES.BODY, label: 'Body text', path: '/theme/fonts/body/family', errorId: 'body-font-error' },
];

/**
 * The heading and body fonts, each on one line that opens a dropdown with the curated Google Fonts
 * list (search and categories). Only one of the two is open at a time.
 */
export function TypeTab({ bind }) {
  const [openRole, setOpenRole] = useState(null);

  return (
    <FormGroup title="Fonts">
      {FONT_FIELDS.map(({ role, label, path, errorId }) => {
        const field = bind(path);
        return (
          <div key={role} className="field">
            <FontDropdown
              label={label}
              value={field.value}
              onValueChange={field.onValueChange}
              isOpen={openRole === role}
              onOpenChange={(isOpen) => setOpenRole(isOpen ? role : null)}
            />
            <FieldError id={errorId}>{field.error}</FieldError>
          </div>
        );
      })}
    </FormGroup>
  );
}
