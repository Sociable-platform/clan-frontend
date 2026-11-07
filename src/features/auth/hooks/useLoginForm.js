import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { validateLoginValues } from '../model/auth.schema';
import { mapLoginError } from '../utils/authErrors';
import { omitKey } from '../utils/omitKey';

import { useLoginMutation } from './useLoginMutation';

/**
 * Form state for the login page. On success the session starts and the guest-only
 * guard redirects, so there is no navigation here.
 */
export function useLoginForm() {
  const location = useLocation();
  const { login, isPending } = useLoginMutation();
  const [values, setValues] = useState({ email: location.state?.email ?? '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Set by the register page after a successful sign-up.
  const notice = location.state?.notice ?? null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => omitKey(current, name));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;

    const errors = validateLoginValues(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    try {
      await login(values);
    } catch (error) {
      const mapped = mapLoginError(error);
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
    }
  };

  return { values, fieldErrors, formError, notice, isPending, handleChange, handleSubmit };
}
