import { useState } from 'react';

import { validateGameValues } from '../model/games.schema';
import { mapRegisterGameError } from '../utils/gamesErrors';

import { useRegisterGameMutation } from './useRegisterGameMutation';

const INITIAL_VALUES = { name: '', description: '' };

/** Form state for "Register existing game". Server validation errors land on their field. */
export function useRegisterGameForm() {
  const { registerGame, isPending } = useRegisterGameMutation();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;

    const errors = validateGameValues(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    try {
      await registerGame(values);
    } catch (error) {
      const mapped = mapRegisterGameError(error);
      setFieldErrors(mapped.fieldErrors);
      setFormError(mapped.formError);
      return;
    }
    setValues(INITIAL_VALUES);
  };

  return { values, fieldErrors, formError, isPending, handleChange, handleSubmit };
}
