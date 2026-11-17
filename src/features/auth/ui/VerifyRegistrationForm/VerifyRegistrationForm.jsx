import { FormAlert } from '@/shared/ui/FormAlert';
import { TextField } from '@/shared/ui/TextField';

import { AUTH_LIMITS } from '../../config/authMessages';

export function VerifyRegistrationForm({
  code,
  fieldErrors,
  formError,
  notice,
  isPending,
  isResending,
  resendWait,
  onChange,
  onSubmit,
  onResend,
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      {notice ? <FormAlert tone="info">{notice}</FormAlert> : null}
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <TextField
        label="Code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={AUTH_LIMITS.VERIFICATION_CODE_LENGTH + 2}
        value={code}
        error={fieldErrors.code}
        onChange={onChange}
      />
      <button type="submit" className="button" disabled={isPending}>
        {isPending ? 'Checking…' : 'Confirm'}
      </button>
      <button
        type="button"
        className="button button-secondary"
        disabled={isResending || resendWait > 0}
        onClick={onResend}
      >
        {resendWait > 0 ? `Send a new code (${resendWait}s)` : 'Send a new code'}
      </button>
    </form>
  );
}
