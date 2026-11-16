import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { requestPasswordReset } from '../api/authApi';
import { validateForgotPasswordValues } from '../model/auth.schema';
import { mapForgotPasswordError } from '../utils/authErrors';

/**
 * Form state for the forgot-password page. After a successful request `sentTo` holds the address,
 * and the page shows the same message whether or not an account with it exists (the server does
 * not say).
 */
export function useForgotPasswordForm() {
  const location = useLocation();
  const [values, setValues] = useState({ email: location.state?.email ?? '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const handleChange = (event) => {
    setValues({ email: event.target.value });
    setFieldErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;

    const errors = validateForgotPasswordValues(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setIsPending(true);
    try {
      await requestPasswordReset(values);
      setSentTo(values.email.trim());
    } catch (error) {
      const mapped = mapForgotPasswordError(error);
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
    } finally {
      setIsPending(false);
    }
  };

  return { values, fieldErrors, formError, isPending, sentTo, handleChange, handleSubmit };
}
