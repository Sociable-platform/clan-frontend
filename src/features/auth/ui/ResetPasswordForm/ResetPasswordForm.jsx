import { FormAlert } from '@/shared/ui/FormAlert';
import { TextField } from '@/shared/ui/TextField';

import { AUTH_LIMITS } from '../../config/authMessages';

export function ResetPasswordForm({ values, fieldErrors, formError, isPending, onChange, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <TextField
        label={`New password (${AUTH_LIMITS.PASSWORD_MIN}-${AUTH_LIMITS.PASSWORD_MAX} characters)`}
        name="password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        error={fieldErrors.password}
        onChange={onChange}
      />
      <TextField
        label="Repeat the new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        error={fieldErrors.confirmPassword}
        onChange={onChange}
      />
      <button type="submit" className="button" disabled={isPending}>
        {isPending ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}
