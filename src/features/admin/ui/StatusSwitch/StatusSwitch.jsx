import { STATUS_MESSAGES } from '../../config/adminConfig';

/**
 * One button that offers the opposite of the current status: Suspend while active, Resume while
 * suspended. It only asks; a dialog confirms before anything is sent. `subjectName` goes into the
 * accessible name so a table of games has a distinct button per row.
 */
export function StatusSwitch({ isSuspended, subjectName, disabled = false, onSuspend, onResume }) {
  const label = isSuspended ? STATUS_MESSAGES.RESUME_LABEL : STATUS_MESSAGES.SUSPEND_LABEL;

  return (
    <button
      type="button"
      className={isSuspended ? 'button button-secondary' : 'button button-danger-outline'}
      aria-label={`${label} ${subjectName}`}
      disabled={disabled}
      onClick={isSuspended ? onResume : onSuspend}
    >
      {label}
    </button>
  );
}
