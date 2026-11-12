import { useState } from 'react';

import { WIDGET_MESSAGES } from '../config/widgetConfig';
import { isSameConfig } from '../utils/isSameConfig';
import { mapPublishError, mapRollbackError } from '../utils/widgetPublishErrors';

import { usePublishWidgetMutation } from './usePublishWidgetMutation';
import { useRollbackWidgetMutation } from './useRollbackWidgetMutation';
import { useWidgetVersionQuery } from './useWidgetVersionQuery';
import { useWidgetVersionsQuery } from './useWidgetVersionsQuery';

export const PUBLISH_STATUS = {
  /** Never published. */
  NOT_PUBLISHED: 'not-published',
  /** The draft is the live version. */
  PUBLISHED: 'published',
  /** The draft differs from the live version. */
  CHANGED: 'changed',
};

/**
 * Publishing, version history, previewing an old version and rolling back, for one game.
 * `draftConfig` is what the editor shows; `saveDraftNow` saves it and resolves true when the
 * server accepted it. Publishing always saves first, because the server publishes the draft it
 * holds, not what the browser shows.
 */
export function useWidgetPublishing({ gameId, draftConfig, saveDraftNow }) {
  const versionsQuery = useWidgetVersionsQuery(gameId);
  const { publish } = usePublishWidgetMutation(gameId);
  const rollback = useRollbackWidgetMutation(gameId);
  const [notice, setNotice] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewVersionNumber, setPreviewVersionNumber] = useState(null);
  const [versionToRollBack, setVersionToRollBack] = useState(null);

  const latest = versionsQuery.versions[0] ?? null;
  // The live config is read once to tell whether the draft has moved on from it.
  const liveQuery = useWidgetVersionQuery(gameId, latest?.version ?? null);
  const previewQuery = useWidgetVersionQuery(gameId, previewVersionNumber);

  let publishStatus = PUBLISH_STATUS.NOT_PUBLISHED;
  if (latest) {
    const hasMoved = liveQuery.version ? !isSameConfig(draftConfig, liveQuery.version.config) : false;
    publishStatus = hasMoved ? PUBLISH_STATUS.CHANGED : PUBLISH_STATUS.PUBLISHED;
  }

  const handlePublish = async () => {
    if (isPublishing) return;
    setNotice(null);
    setIsPublishing(true);
    try {
      if (!(await saveDraftNow())) {
        setNotice({ tone: 'error', message: WIDGET_MESSAGES.PUBLISH_BLOCKED_BY_SAVE, problems: [] });
        return;
      }
      const published = await publish();
      setNotice({
        tone: 'success',
        message: `Published version ${published.version}. Players load this version from now on.`,
        problems: [],
      });
    } catch (error) {
      setNotice({ tone: 'error', ...mapPublishError(error) });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollbackRequest = (version) => {
    rollback.reset();
    setVersionToRollBack(version);
  };

  const handleRollbackCancel = () => {
    if (!rollback.isPending) setVersionToRollBack(null);
  };

  const handleRollbackConfirm = async () => {
    const target = versionToRollBack;
    try {
      const created = await rollback.rollBack(target.version);
      setVersionToRollBack(null);
      setPreviewVersionNumber(null);
      setNotice({
        tone: 'success',
        message: `Rolled back: version ${target.version} is live again, as version ${created.version}.`,
        problems: [],
      });
    } catch {
      // The dialog stays open and shows `rollbackError`; the person can retry or cancel.
    }
  };

  return {
    versions: versionsQuery.versions,
    isHistoryLoading: versionsQuery.isLoading,
    isHistoryError: versionsQuery.isError,
    latestVersion: latest?.version ?? null,
    nextVersion: (latest?.version ?? 0) + 1,
    publishStatus,
    isPublishing,
    notice,
    previewVersion: previewQuery.version,
    previewVersionNumber,
    isPreviewLoading: previewQuery.isLoading,
    isPreviewError: previewQuery.isError,
    versionToRollBack,
    isRollingBack: rollback.isPending,
    rollbackError: rollback.isError ? mapRollbackError(rollback.error) : null,
    handlePublish,
    handleRetryHistory: versionsQuery.refetch,
    handleRetryPreview: previewQuery.refetch,
    handlePreview: setPreviewVersionNumber,
    handleClosePreview: () => setPreviewVersionNumber(null),
    handleRollbackRequest,
    handleRollbackCancel,
    handleRollbackConfirm,
    handleDismissNotice: () => setNotice(null),
  };
}
