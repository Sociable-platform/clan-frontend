import { FormAlert } from '@/shared/ui/FormAlert';
import { TextField } from '@/shared/ui/TextField';

import { AUTH_LIMITS } from '../../config/authMessages';

export function RegisterForm({ values, fieldErrors, formError, isPending, onChange, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <TextField
        label="Name"
        name="name"
        autoComplete="name"
        value={values.name}
        error={fieldErrors.name}
        onChange={onChange}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={values.email}
        error={fieldErrors.email}
        onChange={onChange}
      />
      <TextField
        label={`Password (${AUTH_LIMITS.PASSWORD_MIN}-${AUTH_LIMITS.PASSWORD_MAX} characters)`}
        name="password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        error={fieldErrors.password}
        onChange={onChange}
      />
      <button type="submit" className="button" disabled={isPending}>
        {isPending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
