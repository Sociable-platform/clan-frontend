import { Link } from 'react-router-dom';

import { ResetPasswordForm, useResetPasswordForm } from '@/features/auth';
import { ROUTES } from '@/shared/config';
import { FormAlert } from '@/shared/ui/FormAlert';

/** The page a reset link opens: choose a new password. Open to everyone, signed in or not. */
export function ResetPasswordPage() {
  const form = useResetPasswordForm();

  return (
    <section className="auth-card">
      <h1 className="auth-title">Choose a new password</h1>
      {form.hasToken ? (
        <ResetPasswordForm
          values={form.values}
          fieldErrors={form.fieldErrors}
          formError={form.formError}
          isPending={form.isPending}
          onChange={form.handleChange}
          onSubmit={form.handleSubmit}
        />
      ) : (
        <FormAlert>This reset link is not valid. Ask for a new one.</FormAlert>
      )}
      <p className="auth-links">
        <Link to={ROUTES.forgotPassword}>Ask for a new link</Link>
        <Link to={ROUTES.login}>Back to log in</Link>
      </p>
    </section>
  );
}
