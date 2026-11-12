import { LoginForm, useLoginForm } from '@/features/auth';
import { ROLES } from '@/store';

/** Sign-in for the distributor's staff. No register link: admins are created by hand on the server. */
export function AdminLoginPage() {
  const form = useLoginForm(ROLES.ADMIN);

  return (
    <section className="auth-card">
      <h1 className="auth-title">Admin sign in</h1>
      <LoginForm
        values={form.values}
        fieldErrors={form.fieldErrors}
        formError={form.formError}
        notice={form.notice}
        isPending={form.isPending}
        onChange={form.handleChange}
        onSubmit={form.handleSubmit}
      />
    </section>
  );
}
