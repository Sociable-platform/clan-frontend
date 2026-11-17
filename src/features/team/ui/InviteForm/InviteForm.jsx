import { FormAlert } from '@/shared/ui/FormAlert';
import { TextField } from '@/shared/ui/TextField';

import { TEAM_MESSAGES } from '../../config/teamConfig';

const EMAIL_ERROR_ID = 'invite-email-error';

/**
 * Invite by email. `readOnlyMessage` (optional) turns the form off and says why: the account may not change data.
 * A sent invitation says so below the field, and the field is empty again for the next one. The error of the
 * field is shown under the row, not inside the field's own column: inside it the field gets taller and the
 * button, which lines up with the bottom of the field, would drop below the input.
 */
export function InviteForm({
  values,
  fieldErrors,
  formError,
  isSent,
  isPending,
  readOnlyMessage = null,
  onChange,
  onSubmit,
}) {
  const isReadOnly = readOnlyMessage !== null;
  const emailError = fieldErrors.email;

  return (
    <form className="invite-form" onSubmit={onSubmit} noValidate aria-label={TEAM_MESSAGES.INVITE_HEADING}>
      {formError && !isReadOnly ? <FormAlert>{formError}</FormAlert> : null}
      <div className="invite-form-row">
        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="off"
          className="invite-form-field"
          value={values.email}
          aria-invalid={emailError ? 'true' : undefined}
          aria-describedby={emailError ? EMAIL_ERROR_ID : undefined}
          disabled={isReadOnly}
          onChange={onChange}
        />
        <button
          type="submit"
          className="button"
          disabled={isPending || isReadOnly}
          aria-describedby={isReadOnly ? 'invite-read-only' : undefined}
        >
          {isPending ? TEAM_MESSAGES.INVITE_PENDING : TEAM_MESSAGES.INVITE_SUBMIT}
        </button>
      </div>
      {emailError ? (
        <p id={EMAIL_ERROR_ID} role="alert" className="field-error">
          {emailError}
        </p>
      ) : null}
      {isReadOnly ? (
        <p id="invite-read-only" className="item-meta">
          {readOnlyMessage}
        </p>
      ) : null}
      {isSent ? <FormAlert tone="info">{TEAM_MESSAGES.INVITE_SENT}</FormAlert> : null}
    </form>
  );
}
