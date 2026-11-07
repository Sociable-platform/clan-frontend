import { AuthTabs, RegisterForm, useRegisterForm } from '@/features/auth';

export function RegisterPage() {
  const form = useRegisterForm();

  return (
    <section className="auth-card">
      <h1 className="auth-title">Account for game developers</h1>
      <AuthTabs />
      <RegisterForm
        values={form.values}
        fieldErrors={form.fieldErrors}
        formError={form.formError}
        isPending={form.isPending}
        onChange={form.handleChange}
        onSubmit={form.handleSubmit}
      />
    </section>
  );
}
