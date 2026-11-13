import { FormAlert } from '@/shared/ui/FormAlert';
import { TextField } from '@/shared/ui/TextField';

import { GAMES_MESSAGES } from '../../config/gamesConfig';

/**
 * `readOnlyMessage` (optional) turns the form off and says why: the account may not change data.
 */
export function RegisterGameForm({
  values,
  fieldErrors,
  formError,
  isPending,
  readOnlyMessage = null,
  onChange,
  onSubmit,
}) {
  const isReadOnly = readOnlyMessage !== null;

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
        disabled={isReadOnly}
        onChange={onChange}
      />
      <TextField
        label="Description (optional)"
        name="description"
        autoComplete="off"
        value={values.description}
        error={fieldErrors.description}
        disabled={isReadOnly}
        onChange={onChange}
      />
      <button
        type="submit"
        className="button"
        disabled={isPending || isReadOnly}
        aria-describedby={isReadOnly ? 'register-game-read-only' : undefined}
      >
        {isPending ? GAMES_MESSAGES.REGISTER_PENDING : GAMES_MESSAGES.REGISTER_SUBMIT}
      </button>
      {isReadOnly ? (
        <p id="register-game-read-only" className="item-meta">
          {readOnlyMessage}
        </p>
      ) : null}
    </form>
  );
}
