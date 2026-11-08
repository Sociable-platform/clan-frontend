import { useState } from 'react';

import { useGamesQuery } from '@/features/games';
import {
  ADVANCED_SECTION,
  WIDGET_SECTIONS,
  useWidgetDraftForm,
  useWidgetDraftQuery,
} from '@/features/widget';

const SECTION_ITEMS = [...WIDGET_SECTIONS, ADVANCED_SECTION];

/**
 * Owns the data and UI state of one game's widget editor: the draft (query), the editable
 * copy with its autosave (form) and which section is open. Render it under `key={gameId}`
 * so the open section and the edits never carry over to another game.
 */
export function useWidgetEditorPage(gameId) {
  const { games } = useGamesQuery();
  const draft = useWidgetDraftQuery(gameId);
  const form = useWidgetDraftForm({ gameId, serverConfig: draft.config });
  const [activeSectionId, setActiveSectionId] = useState(WIDGET_SECTIONS[0].id);

  const game = games.find((candidate) => candidate.id === gameId) ?? null;

  return {
    gameName: game?.name ?? null,
    isLoading: draft.isLoading,
    isError: draft.isError && !draft.isGameNotFound,
    isGameNotFound: draft.isGameNotFound,
    isReady: form.config !== null,
    sectionItems: SECTION_ITEMS,
    activeSectionId,
    bind: form.bind,
    status: form.status,
    saveError: form.saveError,
    tabsError: form.rootError,
    problemCounts: form.errorCountBySection,
    unplacedErrors: form.unplacedErrors,
    rawJson: form.rawJson,
    rawBytes: form.rawBytes,
    handleRetryLoad: draft.refetch,
    handleRetrySave: form.handleRetry,
    handleSelectSection: setActiveSectionId,
  };
}
