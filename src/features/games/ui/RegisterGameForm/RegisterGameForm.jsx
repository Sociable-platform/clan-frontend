import { FormAlert } from '@/shared/ui/FormAlert';
import { TextField } from '@/shared/ui/TextField';

import { GAMES_MESSAGES } from '../../config/gamesConfig';

export function RegisterGameForm({ values, fieldErrors, formError, isPending, onChange, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate aria-labelledby="register-game-heading">
      <h2 id="register-game-heading" className="section-title">
        {GAMES_MESSAGES.REGISTER_HEADING}
      </h2>
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <TextField
        label="Game name"
        name="name"
        autoComplete="off"
        value={values.name}
        error={fieldErrors.name}
        onChange={onChange}
      />
      <TextField
        label="Description (optional)"
        name="description"
        autoComplete="off"
        value={values.description}
        error={fieldErrors.description}
        onChange={onChange}
      />
      <button type="submit" className="button" disabled={isPending}>
        {isPending ? GAMES_MESSAGES.REGISTER_PENDING : GAMES_MESSAGES.REGISTER_SUBMIT}
      </button>
    </form>
  );
}
