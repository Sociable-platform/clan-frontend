import { useState } from 'react';

import { useGamesQuery } from '@/features/games';
import {
  LAYOUT_TABS,
  STYLE_TABS,
  useWidgetDraftForm,
  useWidgetDraftQuery,
  useWidgetPublishing,
} from '@/features/widget';

const withProblemCounts = (tabs, counts) => tabs.map((tab) => ({ id: tab.id, label: tab.label, problemCount: counts[tab.id] }));

/**
 * Owns the data and UI state of one game's widget editor: the draft (query), the editable
 * copy with its autosave (form), publishing and version history, the open tab of each panel and
 * whether the config JSON and the history are shown. Render it under `key={gameId}` so tabs and edits never carry over to another game.
 */
export function useWidgetEditorPage(gameId) {
  const { games } = useGamesQuery();
  const draft = useWidgetDraftQuery(gameId);
  const form = useWidgetDraftForm({ gameId, serverConfig: draft.config });
  const publishing = useWidgetPublishing({ gameId, draftConfig: form.config, saveDraftNow: form.saveNow });
  const [activeLayoutTabId, setActiveLayoutTabId] = useState(LAYOUT_TABS[0].id);
  const [activeStyleTabId, setActiveStyleTabId] = useState(STYLE_TABS[0].id);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const game = games.find((candidate) => candidate.id === gameId) ?? null;
  const problemCount = Object.values(form.errorCountBySection).reduce((sum, count) => sum + count, 0);

  return {
    gameName: game?.name ?? null,
    isLoading: draft.isLoading,
    isError: draft.isError && !draft.isGameNotFound,
    isGameNotFound: draft.isGameNotFound,
    isReady: form.config !== null,
    layoutTabs: withProblemCounts(LAYOUT_TABS, form.errorCountBySection),
    styleTabs: withProblemCounts(STYLE_TABS, form.errorCountBySection),
    activeLayoutTabId,
    activeStyleTabId,
    isConfigOpen,
    isHistoryOpen,
    publishing,
    config: form.config,
    bind: form.bind,
    status: form.status,
    saveError: form.saveError,
    tabsError: form.rootError,
    unplacedErrors: form.unplacedErrors,
    problemCount,
    schemaVersion: form.config?.schemaVersion,
    rawJson: form.rawJson,
    rawBytes: form.rawBytes,
    handleRetryLoad: draft.refetch,
    handleRetrySave: form.handleRetry,
    handleSelectLayoutTab: setActiveLayoutTabId,
    handleSelectStyleTab: setActiveStyleTabId,
    handleToggleConfig: () => setIsConfigOpen((isOpen) => !isOpen),
    handleToggleHistory: () => setIsHistoryOpen((isOpen) => !isOpen),
  };
}
