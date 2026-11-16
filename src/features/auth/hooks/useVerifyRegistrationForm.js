import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/shared/config';

import { resendRegistrationCode, verifyRegistration } from '../api/authApi';
import { AUTH_MESSAGES } from '../config/authMessages';
import { validateVerificationCode } from '../model/auth.schema';
import { mapResendCodeError, mapVerifyRegistrationError } from '../utils/authErrors';

// The server sends at most one code a minute; the button waits as long, so it is never refused.
const RESEND_WAIT_SECONDS = 60;

/**
 * Form state for the "enter the code" page that follows the register form when the backend
 * confirms email addresses. `email` comes from the register form through the router state; it is
 * null when the page was opened directly, and the page then sends the visitor back to register.
 * With the right code the account exists, and the browser goes to the login page.
 */
export function useVerifyRegistrationForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email ?? null;
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // A code was sent just before this page opened, so the first wait starts at once.
  const [resendWait, setResendWait] = useState(RESEND_WAIT_SECONDS);

  useEffect(() => {
    if (resendWait <= 0) return undefined;
    const timer = setTimeout(() => setResendWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendWait]);

  const handleChange = (event) => {
    setCode(event.target.value);
    setFieldErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;

    const errors = validateVerificationCode({ code });
    setFieldErrors(errors);
    setFormError(null);
    setNotice(null);
    if (Object.keys(errors).length > 0) return;

    setIsPending(true);
    try {
      await verifyRegistration({ email, code });
    } catch (error) {
      const mapped = mapVerifyRegistrationError(error);
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
      setIsPending(false);
      return;
    }
    navigate(ROUTES.login, { replace: true, state: { notice: AUTH_MESSAGES.REGISTERED, email } });
  };

  const handleResend = async () => {
    if (isResending || resendWait > 0) return;
    setFormError(null);
    setNotice(null);
    setIsResending(true);
    try {
      await resendRegistrationCode({ email });
      setNotice(AUTH_MESSAGES.CODE_RESENT);
      setCode('');
      setFieldErrors({});
    } catch (error) {
      setFormError(mapResendCodeError(error));
    } finally {
      setIsResending(false);
      // Wait again after a failure too: the usual one is "a code was just sent".
      setResendWait(RESEND_WAIT_SECONDS);
    }
  };

  return {
    email,
    code,
    fieldErrors,
    formError,
    notice,
    isPending,
    isResending,
    resendWait,
    handleChange,
    handleSubmit,
    handleResend,
  };
}
