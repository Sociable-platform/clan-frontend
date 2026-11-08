import { SAVE_STATUS, WIDGET_MESSAGES } from '../../config/widgetConfig';

const TEXT_BY_STATUS = {
  [SAVE_STATUS.SAVED]: WIDGET_MESSAGES.SAVED,
  [SAVE_STATUS.SAVING]: WIDGET_MESSAGES.SAVING,
  [SAVE_STATUS.UNSAVED]: WIDGET_MESSAGES.UNSAVED,
  [SAVE_STATUS.ERROR]: WIDGET_MESSAGES.ERROR,
};

/** Autosave state as text (never colour alone). The text is announced politely when it changes. */
export function SaveStatus({ status, onRetry }) {
  return (
    <div className="save-status" data-status={status}>
      <span aria-hidden="true" className="save-status-dot" />
      <p role="status" className="save-status-text">
        {TEXT_BY_STATUS[status]}
      </p>
      {status === SAVE_STATUS.ERROR ? (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          {WIDGET_MESSAGES.RETRY}
        </button>
      ) : null}
    </div>
  );
}
