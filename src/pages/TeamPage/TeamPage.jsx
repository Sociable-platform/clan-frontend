import { Link, useParams } from 'react-router-dom';

import { GAME_ROLE_LABELS } from '@/features/games';
import {
  InviteForm,
  InviteList,
  LeaveGameDialog,
  MemberList,
  RemoveMemberDialog,
  TEAM_MESSAGES,
  TeamListSkeleton,
  TransferOwnershipDialog,
} from '@/features/team';
import { ROUTES } from '@/shared/config';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FormAlert } from '@/shared/ui/FormAlert';

import { useTeamPage } from './useTeamPage';

/** A game's team: who is on it and, for an owner, the invitations and the controls that manage it. */
export function TeamPage() {
  const { gameId } = useParams();
  const page = useTeamPage(gameId);

  if (page.isLoading) {
    return (
      <div className="page">
        <p role="status" className="visually-hidden">
          Loading the team
        </p>
        <TeamListSkeleton />
      </div>
    );
  }

  if (page.isGamesError) {
    return (
      <div className="page">
        <ErrorState title="Could not load your games" message="Check your connection and try again." onRetry={page.handleRetryGames} />
      </div>
    );
  }

  if (page.isGameNotFound) {
    return (
      <div className="page">
        <ErrorState title={TEAM_MESSAGES.GAME_NOT_FOUND_TITLE} message={TEAM_MESSAGES.GAME_NOT_FOUND_MESSAGE} />
        <p>
          <Link to={ROUTES.games}>Back to your games</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="games-header">
        <div className="games-header-text">
          <h1>
            Team of {page.game.name}{' '}
            <span className={page.isOwner ? 'badge' : 'badge badge-muted'}>{GAME_ROLE_LABELS[page.game.role]}</span>
          </h1>
          <p className="games-lead">{TEAM_MESSAGES.PAGE_LEAD}</p>
        </div>
      </div>
      {page.readOnlyMessage ? (
        <p id="team-read-only" className="item-meta">
          {page.readOnlyMessage}
        </p>
      ) : null}
      {!page.isOwner ? (
        <p className="item-meta">Only an owner of the game can invite developers, remove them or hand the game over.</p>
      ) : null}

      {/* One column at a comfortable width: the team, then for an owner inviting under it. */}
      <div className="team-columns">
      <section aria-labelledby="team-members-heading" className="team-section">
        <h2 id="team-members-heading" className="team-heading">
          {TEAM_MESSAGES.MEMBERS_HEADING}
        </h2>
        {page.isMembersError ? (
          <ErrorState
            title={TEAM_MESSAGES.MEMBERS_ERROR_TITLE}
            message="Check your connection and try again."
            onRetry={page.handleRetryMembers}
          />
        ) : (
          <MemberList
            members={page.members}
            currentDeveloperId={page.currentDeveloperId}
            canManage={page.isOwner}
            readOnly={page.readOnlyMessage !== null}
            onRemoveClick={page.handleRemoveClick}
            onTransferClick={page.handleTransferClick}
          />
        )}
      </section>

      {page.isOwner ? (
        <div className="team-side">
          <section aria-labelledby="team-invite-heading" className="team-section">
            <h2 id="team-invite-heading" className="team-heading">
              {TEAM_MESSAGES.INVITE_HEADING}
            </h2>
            <p className="item-meta">{TEAM_MESSAGES.INVITE_DESCRIPTION}</p>
            <InviteForm
              values={page.inviteForm.values}
              fieldErrors={page.inviteForm.fieldErrors}
              formError={page.inviteForm.formError}
              isSent={page.inviteForm.isSent}
              isPending={page.inviteForm.isPending}
              readOnlyMessage={page.readOnlyMessage}
              onChange={page.inviteForm.handleChange}
              onSubmit={page.inviteForm.handleSubmit}
            />
          </section>

          <section aria-labelledby="team-invites-heading" className="team-section">
            <h2 id="team-invites-heading" className="team-heading">
              {TEAM_MESSAGES.INVITES_HEADING}
            </h2>
            {page.cancelInviteError ? <FormAlert>{page.cancelInviteError}</FormAlert> : null}
            {page.isInvitesLoading ? (
              <>
                <p role="status" className="visually-hidden">
                  Loading invitations
                </p>
                <TeamListSkeleton />
              </>
            ) : null}
            {page.isInvitesError ? (
              <ErrorState
                title={TEAM_MESSAGES.INVITES_ERROR_TITLE}
                message={page.invitesErrorMessage ?? 'Check your connection and try again.'}
                onRetry={page.invitesErrorMessage ? undefined : page.handleRetryInvites}
              />
            ) : null}
            {!page.isInvitesLoading && !page.isInvitesError && page.invites.length === 0 ? (
              <EmptyState title={TEAM_MESSAGES.INVITES_EMPTY_TITLE} message={TEAM_MESSAGES.INVITES_EMPTY_MESSAGE} />
            ) : null}
            {page.invites.length > 0 ? (
              <InviteList
                invites={page.invites}
                readOnly={page.readOnlyMessage !== null}
                onCancelClick={page.handleCancelInvite}
              />
            ) : null}
          </section>
        </div>
      ) : null}
        {/* Leaving is the last thing on the page, apart from the everyday controls. */}
        <div className="team-leave">
          <button
            type="button"
            className="button button-danger-outline"
            disabled={page.readOnlyMessage !== null}
            aria-describedby={page.readOnlyMessage ? 'team-read-only' : undefined}
            onClick={page.handleLeaveClick}
          >
            {TEAM_MESSAGES.LEAVE_LABEL}
          </button>
        </div>
      </div>

      <RemoveMemberDialog
        member={page.memberToRemove}
        isPending={page.isRemoving}
        errorMessage={page.removeError}
        onCancel={page.handleRemoveCancel}
        onConfirm={page.handleRemoveConfirm}
      />
      <TransferOwnershipDialog
        member={page.memberToTransfer}
        gameName={page.game.name}
        isPending={page.isTransferring}
        errorMessage={page.transferError}
        onCancel={page.handleTransferCancel}
        onConfirm={page.handleTransferConfirm}
      />
      <LeaveGameDialog
        open={page.isLeaveOpen}
        gameName={page.game.name}
        isPending={page.isLeaving}
        errorMessage={page.leaveError}
        onCancel={page.handleLeaveCancel}
        onConfirm={page.handleLeaveConfirm}
      />
    </div>
  );
}
