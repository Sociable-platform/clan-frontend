import { Link } from 'react-router-dom';

import { ForgotPasswordForm, useForgotPasswordForm } from '@/features/auth';
import { ROUTES } from '@/shared/config';
import { FormAlert } from '@/shared/ui/FormAlert';

/** Asks for the email and has the server send a reset link to it. */
export function ForgotPasswordPage() {
  const form = useForgotPasswordForm();

  return (
    <section className="auth-card">
      <h1 className="auth-title">Reset your password</h1>
      {form.sentTo ? (
        // The same text for a known and an unknown address: the server does not say which it was.
        <FormAlert tone="info">
          If an account exists for {form.sentTo}, we sent it a link to choose a new password. The
          link works for 30 minutes. Check your spam folder if it does not arrive.
        </FormAlert>
      ) : (
        <>
          <p className="auth-hint">
            Enter the email of your account and we will send you a link to choose a new password.
          </p>
          <ForgotPasswordForm
            values={form.values}
            fieldErrors={form.fieldErrors}
            formError={form.formError}
            isPending={form.isPending}
            onChange={form.handleChange}
            onSubmit={form.handleSubmit}
          />
        </>
      )}
      <p className="auth-links">
        <Link to={ROUTES.login}>Back to log in</Link>
      </p>
    </section>
  );
}
