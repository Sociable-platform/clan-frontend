import { describe, expect, it } from 'vitest';

import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { WIDGET_MESSAGES } from '../config/widgetConfig';

import {
  clearFieldErrors,
  findFieldError,
  groupErrorsBySection,
  mapSaveDraftError,
  sectionOfPath,
} from './widgetDraftErrors';

const invalidConfig = (details) =>
  new ApiError({ status: 400, code: 'invalid_widget_config', message: 'Invalid config', details });

describe('mapSaveDraftError for a suspended account', () => {
  it('says the draft was not saved because the account is suspended', () => {
    const error = new ApiError({ status: 403, code: 'account_suspended', message: 'Suspended' });

    expect(mapSaveDraftError(error)).toEqual({
      fieldErrors: {},
      formError: WIDGET_MESSAGES.SUSPENDED_SAVE_ERROR,
    });
  });
});

describe('mapSaveDraftError', () => {
  it('turns validation details into one message per path, preferring the server message', () => {
    const mapped = mapSaveDraftError(
      invalidConfig([
        { path: '/clan/maxMembers', rule: 'maximum', message: 'must be at most 200' },
        { path: '/theme/colors/brand', rule: 'pattern' },
      ]),
    );

    expect(mapped.fieldErrors).toEqual({
      '/clan/maxMembers': 'must be at most 200',
      '/theme/colors/brand': 'This value has a format that is not allowed',
    });
    expect(mapped.formError).toBeNull();
  });

  it('keeps the first message when a path has several', () => {
    const mapped = mapSaveDraftError(
      invalidConfig([
        { path: '/chat/historyLimit', rule: 'maximum' },
        { path: '/chat/historyLimit', rule: 'type' },
      ]),
    );

    expect(mapped.fieldErrors['/chat/historyLimit']).toBe('This value is too large');
  });

  it('shows the server message when a rejected config has no usable details', () => {
    expect(mapSaveDraftError(invalidConfig([])).formError).toBe('Invalid config');
    expect(mapSaveDraftError(invalidConfig([{ rule: 'required' }, null])).formError).toBe('Invalid config');
  });

  it('falls back to a generic rejection message when the server sent no message either', () => {
    const silent = new ApiError({ status: 400, code: 'invalid_widget_config', message: '', details: [] });

    expect(mapSaveDraftError(silent).formError).toBe(WIDGET_MESSAGES.NOT_ACCEPTED);
  });

  it('maps a vanished game, a network failure and anything else to a form message', () => {
    const gone = new ApiError({ status: 404, code: 'game_not_found', message: 'x' });
    const offline = new ApiError({ status: 0, code: API_ERROR_CODES.NETWORK, message: 'Cannot reach the server.' });
    const broken = new ApiError({ status: 500, code: 'internal', message: 'boom' });

    expect(mapSaveDraftError(gone)).toEqual({ fieldErrors: {}, formError: WIDGET_MESSAGES.GAME_GONE });
    expect(mapSaveDraftError(offline)).toEqual({ fieldErrors: {}, formError: 'Cannot reach the server.' });
    expect(mapSaveDraftError(broken)).toEqual({ fieldErrors: {}, formError: WIDGET_MESSAGES.GENERIC_SAVE_ERROR });
    expect(mapSaveDraftError(new Error('x')).formError).toBe(WIDGET_MESSAGES.GENERIC_SAVE_ERROR);
  });
});

describe('field error helpers', () => {
  const errors = { '/theme/textures/panel/asset': 'Choose one', '/clan/maxMembers': 'Too large', '': 'Keep a tab on' };

  it('finds an error on a field or on anything below it', () => {
    expect(findFieldError(errors, '/clan/maxMembers')).toBe('Too large');
    expect(findFieldError(errors, '/theme/textures/panel')).toBe('Choose one');
    expect(findFieldError(errors, '/chat/layout')).toBeNull();
  });

  it('matches the root pointer only against the root path', () => {
    expect(findFieldError(errors, '')).toBe('Keep a tab on');
    expect(findFieldError({ '/clan/maxMembers': 'x' }, '')).toBeNull();
  });

  it('clears the edited field and the root rule, and keeps the rest', () => {
    expect(clearFieldErrors(errors, '/clan/maxMembers')).toEqual({ '/theme/textures/panel/asset': 'Choose one' });
    expect(clearFieldErrors(errors, '/theme/textures/panel')).toEqual({ '/clan/maxMembers': 'Too large' });
  });

  it('routes a path to the section that shows it', () => {
    expect(sectionOfPath('/theme/mode')).toBe('general');
    expect(sectionOfPath('/theme/colors/brand')).toBe('general');
    expect(sectionOfPath('/theme/fonts/body/family')).toBe('general');
    expect(sectionOfPath('/theme/frame/corners')).toBe('general');
    expect(sectionOfPath('/theme/frame/width')).toBe('panel');
    expect(sectionOfPath('/theme/frame/color')).toBe('panel');
    expect(sectionOfPath('/theme/panel/opacity')).toBe('panel');
    expect(sectionOfPath('/theme/buttons/case')).toBe('buttons');
    expect(sectionOfPath('/theme/textures/panel/asset')).toBe('panel');
    expect(sectionOfPath('/theme/textures/content')).toBe('panel');
    expect(sectionOfPath('/theme/textures/bubble/asset')).toBe('messages');
    expect(sectionOfPath('/theme/textures/button')).toBe('buttons');
    expect(sectionOfPath('/theme/textures')).toBe('general');
    expect(sectionOfPath('/theme/components')).toBe('general');
    expect(sectionOfPath('/theme/components/bubbleMine/radius')).toBe('messages');
    expect(sectionOfPath('/theme/components/bubbleTheirs')).toBe('messages');
    expect(sectionOfPath('/theme/components/button/background')).toBe('buttons');
    expect(sectionOfPath('/theme/components/buttonSecondary/radius')).toBe('buttons');
    expect(sectionOfPath('/theme/components/tab/text')).toBe('tabs');
    expect(sectionOfPath('/theme/components/tabSelected/background')).toBe('tabs');
    expect(sectionOfPath('/theme/components/row/radius')).toBe('lists');
    expect(sectionOfPath('')).toBe('layout');
    expect(sectionOfPath('/friends/enabled')).toBe('layout');
    expect(sectionOfPath('/layout/position')).toBe('layout');
    expect(sectionOfPath('/clan/screens/home/header')).toBe('clan');
    expect(sectionOfPath('/chat/layout')).toBe('messages');
    expect(sectionOfPath('/chat/slowModeSeconds')).toBe('chat');
    expect(sectionOfPath('/texts/labels/send')).toBe('texts');
    expect(sectionOfPath('/schemaVersion')).toBeNull();
    expect(sectionOfPath('/layoutX')).toBeNull();
  });

  it('gives a path to the most specific tab, not the first one listed', () => {
    expect(sectionOfPath('/theme/components/buttonSecondary')).toBe('buttons');
    expect(sectionOfPath('/theme/components/tab')).toBe('tabs');
    expect(sectionOfPath('/theme/components/tabSelected')).toBe('tabs');
  });

  it('counts errors per section and lists the ones no section shows', () => {
    const grouped = groupErrorsBySection({ ...errors, '/game_id': 'Bad id', '/clan/tags': 'x' });

    expect(grouped.counts).toEqual({ general: 0, panel: 1, messages: 0, buttons: 0, tabs: 0, lists: 0, layout: 1, clan: 2, chat: 0, texts: 0 });
    expect(grouped.unplaced).toEqual([{ path: '/game_id', message: 'Bad id' }]);
  });
});
