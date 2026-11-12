import { FieldError } from '@/shared/ui/FieldError';
import { FormGroup } from '@/shared/ui/FormGroup';

import { FONT_CATEGORIES } from '../../config/widgetOptions';
import { ALL_FONTS, FONT_ROLES, useFontPicker } from '../../hooks/useFontPicker';

const ROLE_PATHS = {
  [FONT_ROLES.HEADING]: '/theme/fonts/heading/family',
  [FONT_ROLES.BODY]: '/theme/fonts/body/family',
};

/** Pick the heading and body fonts from the curated Google Fonts list, with search and categories. */
export function TypeTab({ bind }) {
  const picker = useFontPicker();
  const heading = bind(ROLE_PATHS[FONT_ROLES.HEADING]);
  const body = bind(ROLE_PATHS[FONT_ROLES.BODY]);
  const active = picker.role === FONT_ROLES.HEADING ? heading : body;
  const roleLabel = picker.role === FONT_ROLES.HEADING ? 'headings' : 'body text';

  return (
    <>
      <FormGroup title="Fonts">
        <div className="role-cards" role="group" aria-label="Font to change">
          {[
            [FONT_ROLES.HEADING, 'Headings', heading],
            [FONT_ROLES.BODY, 'Body text', body],
          ].map(([role, label, field]) => (
            <button
              key={role}
              type="button"
              className="role-card"
              aria-pressed={picker.role === role}
              onClick={() => picker.handleRoleChange(role)}
            >
              <span className="role-card-label">{label}</span>
              <span className="role-card-value">{field.value}</span>
            </button>
          ))}
        </div>
        <FieldError id="heading-font-error">{heading.error}</FieldError>
        <FieldError id="body-font-error">{body.error}</FieldError>
      </FormGroup>

      <FormGroup title="Search Google Fonts">
        <input
          type="search"
          className="field-input"
          aria-label="Search fonts"
          placeholder="Try Orbitron, Russo, fantasy…"
          value={picker.query}
          onChange={(event) => picker.handleQueryChange(event.target.value)}
        />
        <div className="chip-row" role="group" aria-label="Font category">
          {[ALL_FONTS, ...FONT_CATEGORIES].map((category) => (
            <button
              key={category}
              type="button"
              className="chip"
              aria-pressed={picker.category === category}
              onClick={() => picker.handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <p role="status" className="form-group-description">
          {picker.fonts.length} fonts · picking for {roleLabel}
        </p>
        <ul className="font-list" aria-label={`Fonts for ${roleLabel}`}>
          {picker.fonts.map((font) => (
            <li key={font.family}>
              <button
                type="button"
                className="font-row"
                aria-pressed={active.value === font.family}
                onClick={() => active.onValueChange(font.family)}
              >
                <span>{font.family}</span>
                <span className="font-row-category">{font.category}</span>
              </button>
            </li>
          ))}
        </ul>
        {picker.fonts.length === 0 ? <p className="form-group-description">No font matches that search.</p> : null}
      </FormGroup>
    </>
  );
}
