/**
 * The result of a publish or rollback: a success reads as a status, a failure interrupts as an
 * alert and says nothing was published. Server problems that name a field are listed with
 * their path. It stays until dismissed or the next attempt.
 */
export function PublishNotice({ notice, onDismiss }) {
  if (!notice) return null;
  const isError = notice.tone === 'error';

  return (
    <div role={isError ? 'alert' : 'status'} className={`form-alert ${isError ? 'form-alert-error' : 'form-alert-info'} publish-notice`}>
      <div>
        <p className="publish-notice-message">{notice.message}</p>
        {notice.problems.length > 0 ? (
          <ul className="problem-list">
            {notice.problems.map((problem) => (
              <li key={problem.path}>
                <code>{problem.path || 'config'}</code>: {problem.message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button type="button" className="button button-secondary" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
