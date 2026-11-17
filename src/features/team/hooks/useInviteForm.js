import { useState } from 'react';

import { validateInviteValues } from '../model/team.schema';
import { mapInviteError } from '../utils/teamErrors';

import { useInviteToGameMutation } from './useInviteToGameMutation';

const INITIAL_VALUES = { email: '' };

/**
 * Form state for "Invite a developer". A server refusal lands on the field it is about (a bad address,
 * somebody already on the game) or on the form (a rate limit, a lost owner role). `onInvited` runs after
 * the invitation is saved.
 */
export function useInviteForm({ gameId, onInvited }) {
  const { inviteToGame, isPending } = useInviteToGameMutation(gameId);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSent, setIsSent] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setIsSent(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;

    const errors = validateInviteValues(values);
    setFieldErrors(errors);
    setFormError(null);
    setIsSent(false);
    if (Object.keys(errors).length > 0) return;

    try {
      await inviteToGame(values.email);
    } catch (error) {
      const mapped = mapInviteError(error);
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
      return;
    }
    setValues(INITIAL_VALUES);
    setIsSent(true);
    onInvited?.();
  };

  return { values, fieldErrors, formError, isSent, isPending, handleChange, handleSubmit };
}
