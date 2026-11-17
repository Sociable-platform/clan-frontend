import { FormAlert } from '@/shared/ui/FormAlert';
import { TextField } from '@/shared/ui/TextField';

import { GAMES_MESSAGES } from '../../config/gamesConfig';

/**
 * The fields and buttons of "Register existing game"; RegisterGameDialog gives it its title.
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
  onCancel,
}) {
  const isReadOnly = readOnlyMessage !== null;

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate aria-label={GAMES_MESSAGES.REGISTER_HEADING}>
      {/* A refused write is what reveals a suspension: the read-only note below explains it, so no "try again". */}
      {formError && !isReadOnly ? <FormAlert>{formError}</FormAlert> : null}
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
      {isReadOnly ? (
        <p id="register-game-read-only" className="item-meta">
          {readOnlyMessage}
        </p>
      ) : null}
      <div className="dialog-actions">
        <button type="button" className="button button-secondary" disabled={isPending} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="button"
          disabled={isPending || isReadOnly}
          aria-describedby={isReadOnly ? 'register-game-read-only' : undefined}
        >
          {isPending ? GAMES_MESSAGES.REGISTER_PENDING : GAMES_MESSAGES.REGISTER_SUBMIT}
        </button>
      </div>
    </form>
  );
}
