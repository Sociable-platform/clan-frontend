import { SUPPORT_EMAIL } from '@/shared/config';

import { describeSuspension, SUSPENSION_MESSAGES } from '../../config/suspension';
import { useAccountAccess } from '../../hooks/useAccountAccess';
import { useRefreshDeveloper } from '../../hooks/useRefreshDeveloper';

/**
 * Shown on every dashboard page while the signed-in developer's account is suspended: what
 * happened (by reason code), what still works, who to contact, and a way to check whether it has
 * been resumed. Renders nothing for an active developer or an admin.
 */
export function SuspensionBanner() {
  const { isSuspended, statusReason } = useAccountAccess();
  const { refresh, isRefreshing, isError } = useRefreshDeveloper();

  if (!isSuspended) return null;

  return (
    <section role="status" aria-label={SUSPENSION_MESSAGES.BANNER_LABEL} className="banner banner-danger">
      <div className="banner-text">
        <p className="banner-title">{describeSuspension(statusReason)}</p>
        <p className="banner-body">{SUSPENSION_MESSAGES.CONSEQUENCE}</p>
        <p className="banner-body">
          {SUPPORT_EMAIL ? (
            <>
              {SUSPENSION_MESSAGES.CONTACT_WITH_EMAIL} <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </>
          ) : (
            SUSPENSION_MESSAGES.CONTACT_WITHOUT_EMAIL
          )}
        </p>
        {isError ? (
          <p role="alert" className="banner-body">
            {SUSPENSION_MESSAGES.CHECK_FAILED}
          </p>
        ) : null}
      </div>
      <button type="button" className="button button-secondary" disabled={isRefreshing} onClick={refresh}>
        {isRefreshing ? SUSPENSION_MESSAGES.CHECKING : SUSPENSION_MESSAGES.CHECK_AGAIN}
      </button>
    </section>
  );
}
