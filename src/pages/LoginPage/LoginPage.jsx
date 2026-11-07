import { AuthTabs, LoginForm, useLoginForm } from '@/features/auth';

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
    </section>
  );
}
