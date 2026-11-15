import { useEffect, useState } from 'react';

import { useAccountAccess } from '@/features/auth';
import { useGamesQuery } from '@/features/games';
import {
  LAYOUT_TABS,
  STYLE_TABS,
  useUndoShortcuts,
  useWidgetAssets,
  useWidgetDraftForm,
  useWidgetDraftQuery,
  useWidgetPublishing,
} from '@/features/widget';

/** The ids of the cards a button brings into view (set on their wrappers in WidgetEditorPage). */
export const STUDIO_ANCHORS = { history: 'studio-history', config: 'studio-config', versionPreview: 'studio-version-preview' };

const withProblemCounts = (tabs, counts) => tabs.map((tab) => ({ id: tab.id, label: tab.label, problemCount: counts[tab.id] }));

/**
 * Owns the data and UI state of one game's widget editor: the draft (query), the editable
 * copy with its autosave and its undo history (form), publishing and version history, the open tab of each panel and
 * whether the config JSON and the history are shown. Render it under `key={gameId}` so tabs and edits never carry over to another game.
 */
export function useWidgetEditorPage(gameId) {
  const { games } = useGamesQuery();
  const draft = useWidgetDraftQuery(gameId);
  const form = useWidgetDraftForm({ gameId, serverConfig: draft.config });
  const publishing = useWidgetPublishing({ gameId, draftConfig: form.config, saveDraftNow: form.saveNow });
  const assets = useWidgetAssets(gameId);
  // A suspended account is read-only: the draft, Publish and Roll back are turned off.
  const { readOnlyMessage } = useAccountAccess();
  const [activeLayoutTabId, setActiveLayoutTabId] = useState(LAYOUT_TABS[0].id);
  const [activeStyleTabId, setActiveStyleTabId] = useState(STYLE_TABS[0].id);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [previewRequest, setPreviewRequest] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [scrollRequest, setScrollRequest] = useState(null);

  // "Show history" and "Show config" open a card that sits below the preview, often off screen: the
  // page goes to it, so the click visibly does something. Hiding a card never scrolls.
  const toggleCard = (isOpen, setIsOpen, anchor) => {
    setIsOpen(!isOpen);
    if (!isOpen) setScrollRequest((previous) => ({ anchor, id: (previous?.id ?? 0) + 1 }));
  };
  // "Preview" in the history opens that version's card under the history, usually below the window: go to it.
  const handlePreviewVersion = (versionNumber) => {
    publishing.handlePreview(versionNumber);
    setScrollRequest((previous) => ({ anchor: STUDIO_ANCHORS.versionPreview, id: (previous?.id ?? 0) + 1 }));
  };
  useEffect(() => {
    if (!scrollRequest) return;
    const isMotionReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    document.getElementById(scrollRequest.anchor)?.scrollIntoView({ behavior: isMotionReduced ? 'auto' : 'smooth', block: 'start' });
  }, [scrollRequest]);

  // Each request has a new id, so asking for the view that is already open still counts.
  const showInPreview = (view) => setPreviewRequest((previous) => ({ view, id: (previous?.id ?? 0) + 1 }));

  // A style tab is about parts of the widget that are seen on some screens, so opening it shows one of them in the preview.
  const handleSelectStyleTab = (tabId) => {
    setActiveStyleTabId(tabId);
    showInPreview(STYLE_TABS.find((tab) => tab.id === tabId)?.view ?? 'home');
  };

  // Undo and redo, from the buttons in the bar and from the keyboard. A read-only account cannot change the draft either way.
  const canEdit = readOnlyMessage === null;
  useUndoShortcuts({ onUndo: form.undo, onRedo: form.redo, isEnabled: canEdit });

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
    readOnlyMessage,
    config: form.config,
    previewRequest,
    handleShowInPreview: showInPreview,
    assets,
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
    history: {
      canUndo: canEdit && form.canUndo,
      canRedo: canEdit && form.canRedo,
      onUndo: form.undo,
      onRedo: form.redo,
    },
    handleSelectLayoutTab: setActiveLayoutTabId,
    handleSelectStyleTab,
    handlePreviewVersion,
    handleToggleConfig: () => toggleCard(isConfigOpen, setIsConfigOpen, STUDIO_ANCHORS.config),
    handleToggleHistory: () => toggleCard(isHistoryOpen, setIsHistoryOpen, STUDIO_ANCHORS.history),
  };
}
