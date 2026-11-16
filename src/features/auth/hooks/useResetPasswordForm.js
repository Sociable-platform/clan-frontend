import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/shared/config';
import { ROLES, useAuthStore } from '@/store';

import { confirmPasswordReset } from '../api/authApi';
import { AUTH_MESSAGES } from '../config/authMessages';
import { validateResetPasswordValues } from '../model/auth.schema';
import { mapResetPasswordError } from '../utils/authErrors';
import { omitKey } from '../utils/omitKey';
import { readResetToken } from '../utils/resetToken';

const INITIAL_VALUES = { password: '', confirmPassword: '' };

/**
 * Form state for the page a reset link opens. The token is read from the link once and kept in
 * memory; `hasToken` is false when the page was opened without one. On success the browser goes to
 * the login page with a notice.
 */
export function useResetPasswordForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => readResetToken(location.hash));
  const [values, setValues] = useState(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  // The token is in memory now, so take it out of the address bar and the browser history.
  useEffect(() => {
    if (location.hash) navigate({ pathname: location.pathname, search: location.search }, { replace: true });
  }, [location.hash, location.pathname, location.search, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => omitKey(current, name));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;

    const errors = validateResetPasswordValues(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setIsPending(true);
    try {
      await confirmPasswordReset({ token, password: values.password });
    } catch (error) {
      const mapped = mapResetPasswordError(error);
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
      setIsPending(false);
      return;
    }
    // The server now refuses every developer token issued before the reset, so a developer session
    // in this browser is dead: drop it, or the login page would send its owner straight on.
    const session = useAuthStore.getState();
    if (session.role === ROLES.DEVELOPER) session.clearSession();
    navigate(ROUTES.login, { replace: true, state: { notice: AUTH_MESSAGES.PASSWORD_CHANGED } });
  };

  return {
    values,
    fieldErrors,
    formError,
    isPending,
    hasToken: token !== '',
    handleChange,
    handleSubmit,
  };
}
