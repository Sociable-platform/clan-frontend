import { FormAlert } from '@/shared/ui/FormAlert';
import { TextField } from '@/shared/ui/TextField';

export function LoginForm({
  values,
  fieldErrors,
  formError,
  notice,
  isPending,
  onChange,
  onSubmit,
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      {notice ? <FormAlert tone="info">{notice}</FormAlert> : null}
      {formError ? <FormAlert>{formError}</FormAlert> : null}
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
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        error={fieldErrors.password}
        onChange={onChange}
      />
      <button type="submit" className="button" disabled={isPending}>
        {isPending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
}
