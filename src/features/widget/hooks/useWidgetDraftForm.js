import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SAVE_STATUS, WIDGET_AUTOSAVE_DELAY_MS } from '../config/widgetConfig';
import { getIn, removeIn, setIn } from '../utils/configPath';
import { describeConfig } from '../utils/measureConfig';
import {
  clearFieldErrors,
  findFieldError,
  groupErrorsBySection,
  mapSaveDraftError,
} from '../utils/widgetDraftErrors';

import { useSaveWidgetDraftMutation } from './useSaveWidgetDraftMutation';

/**
 * Edits a local copy of the draft and saves it on its own `WIDGET_AUTOSAVE_DELAY_MS` after the
 * last edit. `serverConfig` is only the starting point: once the person edits, the local copy
 * is the truth, so a late refetch can never overwrite their work.
 *
 * Fields are addressed by JSON Pointer; `bind(pointer)` gives a field its value, its server
 * error and its change handlers. A config the server rejects keeps the edits, shows the
 * errors next to their fields and is sent again on the next edit (never in a loop).
 */
export function useWidgetDraftForm({ gameId, serverConfig }) {
  const { saveDraft } = useSaveWidgetDraftMutation(gameId);
  const [localConfig, setLocalConfig] = useState(null);
  const [status, setStatus] = useState(SAVE_STATUS.SAVED);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError, setSaveError] = useState(null);

  const latestRef = useRef(null);
  const timerRef = useRef(null);
  const isSavingRef = useRef(false);
  const saveAgainRef = useRef(false);

  const config = localConfig ?? serverConfig;

  const runSave = useCallback(async () => {
    if (isSavingRef.current) {
      saveAgainRef.current = true;
      return;
    }
    isSavingRef.current = true;
    try {
      let shouldSend = true;
      while (shouldSend) {
        shouldSend = false;
        const sent = latestRef.current;
        setStatus(SAVE_STATUS.SAVING);
        try {
          await saveDraft(sent);
        } catch (error) {
          const mapped = mapSaveDraftError(error);
          setFieldErrors(mapped.fieldErrors);
          setSaveError(mapped.formError);
          setStatus(SAVE_STATUS.ERROR);
          // A newer edit re-arms the timer by itself; resending the rejected config would loop.
          saveAgainRef.current = false;
          return;
        }
        setFieldErrors({});
        setSaveError(null);
        if (saveAgainRef.current) {
          saveAgainRef.current = false;
          shouldSend = true;
        } else {
          // Edited while this request was in flight: the armed timer saves the newer version.
          setStatus(latestRef.current === sent ? SAVE_STATUS.SAVED : SAVE_STATUS.UNSAVED);
        }
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [saveDraft]);

  const applyEdit = (pointer, transform) => {
    const next = transform(latestRef.current ?? serverConfig);
    latestRef.current = next;
    setLocalConfig(next);
    setFieldErrors((current) => clearFieldErrors(current, pointer));
    setSaveError(null);
    setStatus(SAVE_STATUS.UNSAVED);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      runSave();
    }, WIDGET_AUTOSAVE_DELAY_MS);
  };

  const bind = (pointer) => ({
    value: getIn(config, pointer),
    error: findFieldError(fieldErrors, pointer),
    onValueChange: (value) => applyEdit(pointer, (current) => setIn(current, pointer, value)),
    onClear: () => applyEdit(pointer, (current) => removeIn(current, pointer)),
  });

  const handleRetry = () => {
    if (latestRef.current !== null) runSave();
  };

  // Leaving the page with an edit still waiting for its timer saves it now instead of losing it.
  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        runSave();
      }
    },
    [runSave],
  );

  // Closing the tab with unsaved work asks first.
  const hasUnsavedWork = status !== SAVE_STATUS.SAVED;
  useEffect(() => {
    if (!hasUnsavedWork) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedWork]);

  const { counts: errorCountBySection, unplaced: unplacedErrors } = useMemo(
    () => groupErrorsBySection(fieldErrors),
    [fieldErrors],
  );
  const { json: rawJson, bytes: rawBytes } = useMemo(() => describeConfig(config), [config]);

  return {
    config,
    status,
    saveError,
    rootError: fieldErrors[''] ?? null,
    errorCountBySection,
    unplacedErrors,
    rawJson,
    rawBytes,
    bind,
    handleRetry,
  };
}
