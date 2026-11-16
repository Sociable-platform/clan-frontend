import { FormAlert } from '@/shared/ui/FormAlert';
import { TextField } from '@/shared/ui/TextField';

export function ForgotPasswordForm({ values, fieldErrors, formError, isPending, onChange, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
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
      <button type="submit" className="button" disabled={isPending}>
        {isPending ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
