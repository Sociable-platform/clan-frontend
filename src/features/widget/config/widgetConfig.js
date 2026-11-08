// Mirrors docs/config-v1 (the W1 contract). widgetOptions.test.js fails when it drifts from the schema.
export const WIDGET_LIMITS = {
  MAX_CONFIG_BYTES: 64 * 1024,
  MAX_MEMBERS: { MIN: 2, MAX: 200 },
  DESCRIPTION_MAX: { MIN: 20, MAX: 300 },
  MESSAGE_LENGTH: { MIN: 20, MAX: 1000 },
  SLOW_MODE_SECONDS: { MIN: 0, MAX: 30 },
  HISTORY_LIMIT: { MIN: 1, MAX: 50 },
  FRAME_WIDTH: { MIN: 1, MAX: 8 },
  PANEL_OPACITY_PERCENT: { MIN: 50, MAX: 100 },
  LABEL_MAX: 40,
  TERM_MAX: 20,
  CUSTOM_ASSET_ID_MAX: 32,
  BADGES_MAX: 12,
  ROLES: { MIN: 2, MAX: 12 },
  ROLE_NAME_MAX: 20,
  ROLE_ID_MAX: 24,
};

// Autosave waits this long after the last edit (system architecture: "3 s after the last change").
export const WIDGET_AUTOSAVE_DELAY_MS = 3000;

export const SAVE_STATUS = {
  SAVED: 'saved',
  UNSAVED: 'unsaved',
  SAVING: 'saving',
  ERROR: 'error',
};

// Backend error codes this feature gives a specific meaning.
export const WIDGET_ERROR_CODES = {
  GAME_NOT_FOUND: 'game_not_found',
  INVALID_CONFIG: 'invalid_widget_config',
  DRAFT_MISSING: 'widget_draft_missing',
  VERSION_NOT_FOUND: 'widget_version_not_found',
};

export const WIDGET_MESSAGES = {
  PAGE_TITLE: 'Widget',
  SAVED: 'Saved',
  SAVING: 'Saving…',
  UNSAVED: 'Unsaved changes',
  ERROR: 'Could not save',
  RETRY: 'Retry',
  LOAD_ERROR_TITLE: 'Could not load the widget draft',
  LOAD_ERROR_MESSAGE: 'Check your connection and try again.',
  GAME_NOT_FOUND_TITLE: 'Game not found',
  GAME_NOT_FOUND_MESSAGE: 'This game does not exist or belongs to another developer.',
  GENERIC_SAVE_ERROR: 'Could not save the draft. Try again.',
  NOT_ACCEPTED: 'The server did not accept the draft. Fix the marked fields and it will save again.',
  GAME_GONE: 'This game no longer exists, so the draft cannot be saved.',
  TABS_NEED_ONE: 'Keep at least one tab on: Friends, Clan or Chat.',
  RESET_TEXTS: 'Reset texts to defaults',

  PUBLISH: 'Publish',
  PUBLISHING: 'Publishing…',
  NOT_PUBLISHED: 'Not published yet',
  UNPUBLISHED_CHANGES: 'Draft · unpublished changes',
  PUBLISH_BLOCKED_BY_SAVE: 'Nothing was published, because the draft could not be saved. Fix what is marked and publish again.',
  PUBLISH_REJECTED: 'Nothing was published: the server does not accept the saved draft. Fix it and publish again.',
  PUBLISH_NO_DRAFT: 'Nothing was published: there is no saved draft yet. Change something in the editor and publish again.',
  PUBLISH_GENERIC_ERROR: 'Could not publish. Try again.',
  PUBLISH_GAME_GONE: 'This game no longer exists, so nothing was published.',

  HISTORY_TITLE: 'Version history',
  HISTORY_EMPTY_TITLE: 'Nothing published yet',
  HISTORY_EMPTY_MESSAGE: 'Publish the draft to create version 1. Players only ever see published versions.',
  HISTORY_ERROR_TITLE: 'Could not load the version history',
  HISTORY_LIVE: 'Live',
  HISTORY_PREVIEWING: 'Previewing',
  HISTORY_PREVIEW: 'Preview',
  HISTORY_ROLL_BACK: 'Roll back',

  PREVIEW_BACK: 'Back to draft',
  PREVIEW_ERROR_TITLE: 'Could not load this version',

  ROLLBACK_CONFIRM: 'Roll back',
  ROLLBACK_PENDING: 'Rolling back…',
  ROLLBACK_ERROR: 'Could not roll back. Try again.',
  ROLLBACK_VERSION_GONE: 'That version no longer exists.',
};

// Wording for a validation rule when the server sends a path and rule but no message.
export const RULE_MESSAGES = {
  required: 'This field is required',
  additionalProperties: 'This field is not allowed',
  pattern: 'This value has a format that is not allowed',
  enum: 'Choose one of the allowed values',
  const: 'This value is not allowed',
  type: 'This value has the wrong type',
  minimum: 'This value is too small',
  maximum: 'This value is too large',
  minLength: 'This text is too short',
  maxLength: 'This text is too long',
  uniqueItems: 'Remove the duplicate',
  maxItems: 'Too many items',
  anyOf: 'Keep at least one tab on: Friends, Clan or Chat.',
  not: 'This value is not allowed',
};
export const DEFAULT_RULE_MESSAGE = 'This value is not valid';
