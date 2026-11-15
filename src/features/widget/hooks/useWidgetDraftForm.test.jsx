import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api';
import { buildWidgetConfig } from '@/test/builders';

import { saveWidgetDraft } from '../api/widgetApi';
import { SAVE_STATUS, WIDGET_AUTOSAVE_DELAY_MS } from '../config/widgetConfig';

import { useWidgetDraftForm } from './useWidgetDraftForm';

vi.mock('../api/widgetApi');

const GAME_ID = 'g1';

function renderForm(serverConfig = buildWidgetConfig()) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } });
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const view = renderHook(() => useWidgetDraftForm({ gameId: GAME_ID, serverConfig }), { wrapper });
  return { ...view, serverConfig };
}

const edit = (result, pointer, value) => act(() => result.current.bind(pointer).onValueChange(value));
const waitForAutosave = () => act(() => vi.advanceTimersByTimeAsync(WIDGET_AUTOSAVE_DELAY_MS));

const rejected = (details) =>
  new ApiError({ status: 400, code: 'invalid_widget_config', message: 'Invalid config', details });

describe('useWidgetDraftForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    saveWidgetDraft.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts saved with the server config and nothing sent', async () => {
    const { result, serverConfig } = renderForm();

    await waitForAutosave();

    expect(result.current.config).toBe(serverConfig);
    expect(result.current.status).toBe(SAVE_STATUS.SAVED);
    expect(saveWidgetDraft).not.toHaveBeenCalled();
  });

  it('updates the config at once and marks it unsaved', () => {
    const { result } = renderForm();

    edit(result, '/clan/maxMembers', 12);

    expect(result.current.bind('/clan/maxMembers').value).toBe(12);
    expect(result.current.config.clan.maxMembers).toBe(12);
    expect(result.current.rawJson).toContain('"maxMembers": 12');
    expect(result.current.status).toBe(SAVE_STATUS.UNSAVED);
    expect(saveWidgetDraft).not.toHaveBeenCalled();
  });

  it('saves the edited config after the delay and then reports saved', async () => {
    const { result } = renderForm();
    edit(result, '/clan/maxMembers', 12);

    await waitForAutosave();

    expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
    expect(saveWidgetDraft).toHaveBeenCalledWith({
      gameId: GAME_ID,
      config: buildWidgetConfig((c) => {
        c.clan.maxMembers = 12;
      }),
    });
    expect(result.current.status).toBe(SAVE_STATUS.SAVED);
  });

  it('reports saving while the request is in flight', async () => {
    let finish;
    saveWidgetDraft.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result } = renderForm();
    edit(result, '/chat/layout', 'log');

    await waitForAutosave();
    expect(result.current.status).toBe(SAVE_STATUS.SAVING);

    await act(async () => finish());
    expect(result.current.status).toBe(SAVE_STATUS.SAVED);
  });

  it('sends one save for a burst of edits, with the last value', async () => {
    const { result } = renderForm();

    edit(result, '/clan/maxMembers', 5);
    await act(() => vi.advanceTimersByTimeAsync(WIDGET_AUTOSAVE_DELAY_MS - 1));
    edit(result, '/clan/maxMembers', 6);
    await act(() => vi.advanceTimersByTimeAsync(WIDGET_AUTOSAVE_DELAY_MS - 1));
    expect(saveWidgetDraft).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));

    expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
    expect(saveWidgetDraft.mock.calls[0][0].config.clan.maxMembers).toBe(6);
  });

  it('removes a key when a field is cleared', () => {
    const { result } = renderForm();

    edit(result, '/texts/labels/send', 'Go');
    act(() => result.current.bind('/texts/labels/send').onClear());

    expect('send' in result.current.config.texts.labels).toBe(false);
  });

  it('does not touch the server config object', () => {
    const { result, serverConfig } = renderForm();

    edit(result, '/clan/maxMembers', 99);

    expect(serverConfig.clan.maxMembers).toBe(30);
  });

  describe('when the server rejects the config', () => {
    const details = [
      { path: '/clan/maxMembers', rule: 'maximum', message: 'must be at most 200' },
      { path: '/theme/colors/brand', rule: 'pattern' },
    ];

    it('keeps the edits, shows each error on its field and counts them per section', async () => {
      saveWidgetDraft.mockRejectedValue(rejected(details));
      const { result } = renderForm();
      edit(result, '/clan/maxMembers', 500);

      await waitForAutosave();

      expect(result.current.status).toBe(SAVE_STATUS.ERROR);
      expect(result.current.bind('/clan/maxMembers').error).toBe('must be at most 200');
      expect(result.current.bind('/theme/colors/brand').error).toBe('This value has a format that is not allowed');
      expect(result.current.bind('/chat/layout').error).toBeNull();
      expect(result.current.errorCountBySection).toMatchObject({ clan: 1, general: 1, chat: 0 });
      expect(result.current.config.clan.maxMembers).toBe(500);
    });

    it('does not resend the same config on its own', async () => {
      saveWidgetDraft.mockRejectedValue(rejected(details));
      const { result } = renderForm();
      edit(result, '/clan/maxMembers', 500);

      await waitForAutosave();
      await act(() => vi.advanceTimersByTimeAsync(WIDGET_AUTOSAVE_DELAY_MS * 3));

      expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
    });

    it('clears the error of an edited field only, and saves again', async () => {
      saveWidgetDraft.mockRejectedValueOnce(rejected(details)).mockResolvedValue(undefined);
      const { result } = renderForm();
      edit(result, '/clan/maxMembers', 500);
      await waitForAutosave();

      edit(result, '/clan/maxMembers', 100);

      expect(result.current.bind('/clan/maxMembers').error).toBeNull();
      expect(result.current.bind('/theme/colors/brand').error).not.toBeNull();
      await waitForAutosave();
      expect(saveWidgetDraft).toHaveBeenCalledTimes(2);
      expect(result.current.status).toBe(SAVE_STATUS.SAVED);
      expect(result.current.bind('/theme/colors/brand').error).toBeNull();
    });

    it('lists an error that no field shows', async () => {
      saveWidgetDraft.mockRejectedValue(rejected([{ path: '/game_id', rule: 'pattern', message: 'Bad id' }]));
      const { result } = renderForm();
      edit(result, '/clan/tags', false);

      await waitForAutosave();

      expect(result.current.unplacedErrors).toEqual([{ path: '/game_id', message: 'Bad id' }]);
    });

    it('reports a root error such as the tab rule', async () => {
      saveWidgetDraft.mockRejectedValue(rejected([{ path: '', rule: 'anyOf' }]));
      const { result } = renderForm();
      edit(result, '/chat/enabled', false);

      await waitForAutosave();

      expect(result.current.rootError).toBe('Keep at least one tab on: Friends, Clan or Chat.');
    });
  });

  describe('when saving fails for another reason', () => {
    it('shows the message, keeps the edits and retries on request', async () => {
      saveWidgetDraft
        .mockRejectedValueOnce(new ApiError({ status: 0, code: 'network_error', message: 'Cannot reach the server.' }))
        .mockResolvedValue(undefined);
      const { result } = renderForm();
      edit(result, '/chat/historyLimit', 20);

      await waitForAutosave();
      expect(result.current.status).toBe(SAVE_STATUS.ERROR);
      expect(result.current.saveError).toBe('Cannot reach the server.');
      expect(result.current.config.chat.historyLimit).toBe(20);

      await act(async () => result.current.handleRetry());

      expect(saveWidgetDraft).toHaveBeenCalledTimes(2);
      expect(result.current.status).toBe(SAVE_STATUS.SAVED);
      expect(result.current.saveError).toBeNull();
    });
  });

  it('saves an edit made while a save is in flight, and ends saved with the newest config', async () => {
    let finishFirst;
    saveWidgetDraft.mockReturnValueOnce(new Promise((resolve) => (finishFirst = resolve))).mockResolvedValue(undefined);
    const { result } = renderForm();
    edit(result, '/clan/maxMembers', 10);
    await waitForAutosave();
    expect(result.current.status).toBe(SAVE_STATUS.SAVING);

    edit(result, '/clan/maxMembers', 11);
    await act(async () => finishFirst());
    expect(result.current.status).toBe(SAVE_STATUS.UNSAVED);
    await waitForAutosave();

    expect(saveWidgetDraft).toHaveBeenCalledTimes(2);
    expect(saveWidgetDraft.mock.calls[1][0].config.clan.maxMembers).toBe(11);
    expect(result.current.status).toBe(SAVE_STATUS.SAVED);
  });

  it('saves a waiting edit right away when the page is left', async () => {
    const { result, unmount } = renderForm();
    edit(result, '/clan/maxMembers', 12);

    unmount();
    await vi.advanceTimersByTimeAsync(0);

    expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
    expect(saveWidgetDraft.mock.calls[0][0].config.clan.maxMembers).toBe(12);
  });

  it('sends nothing on leaving when there is nothing to save', async () => {
    const { unmount } = renderForm();

    unmount();
    await vi.advanceTimersByTimeAsync(WIDGET_AUTOSAVE_DELAY_MS);

    expect(saveWidgetDraft).not.toHaveBeenCalled();
  });

  it('asks before the tab closes while work is unsaved, and stops asking once saved', async () => {
    const { result } = renderForm();
    const closeEvent = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(closeEvent()).toBe(false);

    edit(result, '/clan/maxMembers', 12);
    expect(closeEvent()).toBe(true);

    await waitForAutosave();
    expect(closeEvent()).toBe(false);
  });

  describe('saveNow', () => {
    it('saves a waiting edit at once, without the delay, and says it worked', async () => {
      const { result } = renderForm();
      edit(result, '/clan/maxMembers', 12);

      let outcome;
      await act(async () => {
        outcome = await result.current.saveNow();
      });

      expect(outcome).toBe(true);
      expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
      expect(saveWidgetDraft.mock.calls[0][0].config.clan.maxMembers).toBe(12);
      expect(result.current.status).toBe(SAVE_STATUS.SAVED);
      await waitForAutosave();
      expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
    });

    it('sends a draft nobody edited, so the server holds what the editor shows', async () => {
      const { result, serverConfig } = renderForm();

      let outcome;
      await act(async () => {
        outcome = await result.current.saveNow();
      });

      expect(outcome).toBe(true);
      expect(saveWidgetDraft).toHaveBeenCalledWith({ gameId: GAME_ID, config: serverConfig });
    });

    it('says it failed when the server rejects the draft, and keeps the errors on the fields', async () => {
      saveWidgetDraft.mockRejectedValue(rejected([{ path: '/clan/maxMembers', rule: 'maximum', message: 'too big' }]));
      const { result } = renderForm();
      edit(result, '/clan/maxMembers', 500);

      let outcome;
      await act(async () => {
        outcome = await result.current.saveNow();
      });

      expect(outcome).toBe(false);
      expect(result.current.status).toBe(SAVE_STATUS.ERROR);
      expect(result.current.bind('/clan/maxMembers').error).toBe('too big');
    });

    it('waits for a save that is already running, and for the edit made meanwhile', async () => {
      let finishFirst;
      saveWidgetDraft.mockReturnValueOnce(new Promise((resolve) => (finishFirst = resolve))).mockResolvedValue(undefined);
      const { result } = renderForm();
      edit(result, '/clan/maxMembers', 10);
      await waitForAutosave();
      expect(result.current.status).toBe(SAVE_STATUS.SAVING);
      edit(result, '/clan/maxMembers', 11);

      let outcome;
      let settled = false;
      const pending = act(async () => {
        outcome = await result.current.saveNow();
        settled = true;
      });
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(settled).toBe(false);
      await act(async () => finishFirst());
      await pending;

      expect(outcome).toBe(true);
      expect(saveWidgetDraft).toHaveBeenCalledTimes(2);
      expect(saveWidgetDraft.mock.calls[1][0].config.clan.maxMembers).toBe(11);
      expect(result.current.status).toBe(SAVE_STATUS.SAVED);
    });
  });

  describe('undo and redo', () => {
    // Edits a moment apart, so each one is a step of its own (quick edits of one field are joined).
    const later = () => act(() => vi.advanceTimersByTime(1000));
    const maxMembers = (result) => result.current.config.clan.maxMembers;

    it('has nothing to undo or redo before an edit', () => {
      const { result } = renderForm();

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('undoes an edit, and saves the draft as it was', async () => {
      const { result, serverConfig } = renderForm();
      const before = serverConfig.clan.maxMembers;
      edit(result, '/clan/maxMembers', before + 5);
      expect(result.current.canUndo).toBe(true);

      act(() => result.current.undo());

      expect(maxMembers(result)).toBe(before);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
      expect(result.current.status).toBe(SAVE_STATUS.UNSAVED);

      await waitForAutosave();

      expect(saveWidgetDraft).toHaveBeenCalledTimes(1);
      expect(saveWidgetDraft.mock.calls[0][0].config.clan.maxMembers).toBe(before);
      expect(result.current.status).toBe(SAVE_STATUS.SAVED);
    });

    it('redoes what was undone', () => {
      const { result, serverConfig } = renderForm();
      const edited = serverConfig.clan.maxMembers + 5;
      edit(result, '/clan/maxMembers', edited);
      act(() => result.current.undo());

      act(() => result.current.redo());

      expect(maxMembers(result)).toBe(edited);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('steps back through edits of different fields one at a time', () => {
      const { result, serverConfig } = renderForm();
      edit(result, '/clan/maxMembers', serverConfig.clan.maxMembers + 5);
      later();
      edit(result, '/chat/slowModeSeconds', 17);

      act(() => result.current.undo());

      expect(result.current.config.chat.slowModeSeconds).toBe(serverConfig.chat.slowModeSeconds);
      expect(maxMembers(result)).toBe(serverConfig.clan.maxMembers + 5);

      act(() => result.current.undo());

      expect(result.current.config).toEqual(serverConfig);
    });

    it('forgets the undone steps after a new edit', () => {
      const { result, serverConfig } = renderForm();
      edit(result, '/clan/maxMembers', serverConfig.clan.maxMembers + 5);
      act(() => result.current.undo());
      later();

      edit(result, '/chat/slowModeSeconds', 17);

      expect(result.current.canRedo).toBe(false);
    });

    it('treats typing in one field as one step', () => {
      const { result, serverConfig } = renderForm();
      edit(result, '/texts/labels/panelTitle', 'H');
      act(() => vi.advanceTimersByTime(150));
      edit(result, '/texts/labels/panelTitle', 'Hu');
      act(() => vi.advanceTimersByTime(150));
      edit(result, '/texts/labels/panelTitle', 'Hub');

      act(() => result.current.undo());

      expect(result.current.config).toEqual(serverConfig);
      expect(result.current.canUndo).toBe(false);
    });

    it('clears the field errors of a rejected save when undoing', async () => {
      saveWidgetDraft.mockRejectedValueOnce(rejected([{ path: '/clan/maxMembers', rule: 'maximum', message: 'too big' }]));
      const { result } = renderForm();
      edit(result, '/clan/maxMembers', 9999);
      await waitForAutosave();
      expect(result.current.bind('/clan/maxMembers').error).toBe('too big');

      act(() => result.current.undo());

      expect(result.current.bind('/clan/maxMembers').error).toBeNull();
    });
  });
});
