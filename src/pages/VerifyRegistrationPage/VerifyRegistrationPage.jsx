import { Link, Navigate } from 'react-router-dom';

import { useVerifyRegistrationForm, VerifyRegistrationForm } from '@/features/auth';
import { ROUTES } from '@/shared/config';

/**
 * The step after the register form when the backend confirms email addresses: enter the 6-digit
 * code that was emailed. The account is created only here. Opened without coming from the
 * register form, there is no address to confirm, so the visitor is sent to register.
 */
export function VerifyRegistrationPage() {
  const form = useVerifyRegistrationForm();

  if (!form.email) return <Navigate to={ROUTES.register} replace />;

  return (
    <section className="auth-card">
      <h1 className="auth-title">Confirm your email address</h1>
      <p className="auth-hint">
        We sent a 6-digit code to <strong>{form.email}</strong>. Enter it to create your account.
        The code works for 15 minutes; check your spam folder if it does not arrive.
      </p>
      <VerifyRegistrationForm
        code={form.code}
        fieldErrors={form.fieldErrors}
        formError={form.formError}
        notice={form.notice}
        isPending={form.isPending}
        isResending={form.isResending}
        resendWait={form.resendWait}
        onChange={form.handleChange}
        onSubmit={form.handleSubmit}
        onResend={form.handleResend}
      />
      <p className="auth-links">
        <Link to={ROUTES.register}>Use another email address</Link>
      </p>
    </section>
  );
}
