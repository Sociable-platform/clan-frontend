import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/shared/config';

import { AUTH_MESSAGES } from '../config/authMessages';
import { validateRegisterValues } from '../model/auth.schema';
import { mapRegisterError } from '../utils/authErrors';
import { omitKey } from '../utils/omitKey';

import { useRegisterMutation } from './useRegisterMutation';

const INITIAL_VALUES = { name: '', email: '', password: '' };

/**
 * Form state for the register page. Server validation errors land on their field. On success the
 * browser goes to the login page, or, when the backend wants the email address confirmed first,
 * to the page that asks for the emailed code.
 */
export function useRegisterForm() {
  const navigate = useNavigate();
  const { register, isPending } = useRegisterMutation();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => omitKey(current, name));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;

    const errors = validateRegisterValues(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    let result;
    try {
      result = await register(values);
    } catch (error) {
      const mapped = mapRegisterError(error);
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
      return;
    }
    const email = values.email.trim();
    // Email verification is on: no account yet. The next page asks for the code that was emailed.
    if (result?.needsVerification) {
      navigate(ROUTES.registerVerify, { state: { email } });
      return;
    }
    navigate(ROUTES.login, {
      replace: true,
      state: { notice: AUTH_MESSAGES.REGISTERED, email },
    });
  };

  return { values, fieldErrors, formError, isPending, handleChange, handleSubmit };
}
