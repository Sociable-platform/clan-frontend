import { describe, expect, it } from 'vitest';

import { API_ERROR_CODES, ApiError } from '@/shared/api';

import { WIDGET_MESSAGES } from '../config/widgetConfig';

import { mapPublishError, mapRollbackError } from './widgetPublishErrors';

const apiError = (status, code, message = 'x', details = []) => new ApiError({ status, code, message, details });

describe('mapPublishError', () => {
  it('explains a rejected draft, with the server message', () => {
    const mapped = mapPublishError(apiError(400, 'invalid_widget_config', 'Config must be a JSON object'));

    expect(mapped.message).toContain('Nothing was published');
    expect(mapped.message).toContain('Server: Config must be a JSON object.');
    expect(mapped.problems).toEqual([]);
  });

  it('lists the problems the server names, with their paths', () => {
    const mapped = mapPublishError(
      apiError(400, 'invalid_widget_config', 'Invalid', [
        { path: '/clan/maxMembers', rule: 'maximum', message: 'must be at most 200' },
        { path: '/chat/layout', rule: 'enum' },
        { rule: 'required' },
      ]),
    );

    expect(mapped.problems).toEqual([
      { path: '/clan/maxMembers', message: 'must be at most 200' },
      { path: '/chat/layout', message: 'This value is not valid' },
    ]);
  });

  it('explains that there is no saved draft', () => {
    expect(mapPublishError(apiError(409, 'widget_draft_missing')).message).toBe(WIDGET_MESSAGES.PUBLISH_NO_DRAFT);
  });

  it('explains a vanished game, a network failure and anything else, always without claiming a publish', () => {
    expect(mapPublishError(apiError(404, 'game_not_found')).message).toBe(WIDGET_MESSAGES.PUBLISH_GAME_GONE);
    expect(mapPublishError(apiError(0, API_ERROR_CODES.NETWORK, 'Cannot reach the server.')).message).toBe('Cannot reach the server.');
    expect(mapPublishError(apiError(500, 'internal')).message).toBe(WIDGET_MESSAGES.PUBLISH_GENERIC_ERROR);
    expect(mapPublishError(new Error('x')).message).toBe(WIDGET_MESSAGES.PUBLISH_GENERIC_ERROR);
  });
});

describe('suspended accounts', () => {
  it('says nothing was published, or rolled back, when the account is suspended', () => {
    const error = apiError(403, 'account_suspended');

    expect(mapPublishError(error).message).toBe(WIDGET_MESSAGES.PUBLISH_SUSPENDED);
    expect(mapRollbackError(error)).toBe(WIDGET_MESSAGES.ROLLBACK_SUSPENDED);
  });
});

describe('mapRollbackError', () => {
  it('maps a missing version, a network failure and anything else to one message', () => {
    expect(mapRollbackError(apiError(404, 'widget_version_not_found'))).toBe(WIDGET_MESSAGES.ROLLBACK_VERSION_GONE);
    expect(mapRollbackError(apiError(0, API_ERROR_CODES.NETWORK, 'Cannot reach the server.'))).toBe('Cannot reach the server.');
    expect(mapRollbackError(apiError(500, 'internal'))).toBe(WIDGET_MESSAGES.ROLLBACK_ERROR);
    expect(mapRollbackError(new Error('x'))).toBe(WIDGET_MESSAGES.ROLLBACK_ERROR);
  });
});
