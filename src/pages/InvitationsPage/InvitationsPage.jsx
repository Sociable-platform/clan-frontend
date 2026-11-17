import { Link } from 'react-router-dom';

import { INVITATIONS_MESSAGES, InvitationList, InvitationListSkeleton } from '@/features/invitations';
import { ROUTES } from '@/shared/config';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FormAlert } from '@/shared/ui/FormAlert';

import { useInvitationsPage } from './useInvitationsPage';

/** The invitations sent to the signed-in developer's email address, with Accept and Decline. */
export function InvitationsPage() {
  const page = useInvitationsPage();

  return (
    <div className="page">
      <div className="games-header">
        <div className="games-header-text">
          <h1>{INVITATIONS_MESSAGES.PAGE_TITLE}</h1>
          <p className="games-lead">{INVITATIONS_MESSAGES.PAGE_LEAD}</p>
        </div>
      </div>
      {page.readOnlyMessage ? <p className="item-meta">{page.readOnlyMessage}</p> : null}
      {page.answerError ? <FormAlert>{page.answerError}</FormAlert> : null}
      {page.joinedGame ? (
        <FormAlert tone="info">
          You joined {page.joinedGame.name}.{' '}
          <Link to={ROUTES.widget(page.joinedGame.id)}>Customize its widget</Link> or{' '}
          <Link to={ROUTES.team(page.joinedGame.id)}>see the team</Link>.
        </FormAlert>
      ) : null}
      <section aria-label="Your invitations">
        {page.isLoading ? (
          <>
            <p role="status" className="visually-hidden">
              Loading invitations
            </p>
            <InvitationListSkeleton />
          </>
        ) : null}
        {page.isError ? (
          <ErrorState
            title={INVITATIONS_MESSAGES.LIST_ERROR_TITLE}
            message="Check your connection and try again."
            onRetry={page.handleRetry}
          />
        ) : null}
        {page.isEmpty ? (
          <EmptyState title={INVITATIONS_MESSAGES.LIST_EMPTY_TITLE} message={INVITATIONS_MESSAGES.LIST_EMPTY_MESSAGE} />
        ) : null}
        {page.hasInvitations ? (
          <InvitationList
            invitations={page.invitations}
            pendingId={page.pendingId}
            readOnly={page.readOnlyMessage !== null}
            onAccept={page.handleAccept}
            onDecline={page.handleDecline}
          />
        ) : null}
      </section>
    </div>
  );
}
