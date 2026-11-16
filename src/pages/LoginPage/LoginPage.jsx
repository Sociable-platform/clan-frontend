import { Link } from 'react-router-dom';

import { AuthTabs, LoginForm, useLoginForm } from '@/features/auth';
import { ROUTES } from '@/shared/config';

export function LoginPage() {
  const form = useLoginForm();

  return (
    <section className="auth-card">
      <h1 className="auth-title">Account for game developers</h1>
      <AuthTabs />
      <LoginForm
        values={form.values}
        fieldErrors={form.fieldErrors}
        formError={form.formError}
        notice={form.notice}
        isPending={form.isPending}
        onChange={form.handleChange}
        onSubmit={form.handleSubmit}
      />
      <p className="auth-links">
        {/* The address already typed goes along, so it is not asked for twice. */}
        <Link to={ROUTES.forgotPassword} state={{ email: form.values.email }}>
          Forgot password?
        </Link>
      </p>
    </section>
  );
}
