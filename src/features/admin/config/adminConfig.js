// Limits and codes copied from openapi/platform.yaml (listAdminDevelopers).
export const ADMIN_LIMITS = {
  SEARCH_MAX: 100,
  PAGE_SIZE: 25,
  AUDIT_PAGE_SIZE: 25,
  NOTE_MAX: 1000,
};

export const ADMIN_ERROR_CODES = {
  DEVELOPER_NOT_FOUND: 'developer_not_found',
  GAME_NOT_FOUND: 'game_not_found',
  // 400s from the status endpoints: the reason or note the admin sent was refused.
  REASON_REQUIRED: 'reason_required',
  INVALID_REASON: 'invalid_reason',
  INVALID_NOTE: 'invalid_note',
  INVALID_STATUS: 'invalid_status',
};

// How long typing must pause before the list is searched again.
export const SEARCH_DEBOUNCE_MS = 300;

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
};

// The filter's "All" is an empty string: no `status` parameter is sent.
export const ALL_STATUSES = '';

export const STATUS_LABELS = {
  [ACCOUNT_STATUS.ACTIVE]: 'Active',
  [ACCOUNT_STATUS.SUSPENDED]: 'Suspended',
};

export const STATUS_FILTER_OPTIONS = [
  { value: ALL_STATUSES, label: 'All statuses' },
  { value: ACCOUNT_STATUS.ACTIVE, label: STATUS_LABELS[ACCOUNT_STATUS.ACTIVE] },
  { value: ACCOUNT_STATUS.SUSPENDED, label: STATUS_LABELS[ACCOUNT_STATUS.SUSPENDED] },
];

export const ADMIN_MESSAGES = {
  DEVELOPERS_HEADING: 'Developers',
  LOADING: 'Loading developers',
  LIST_ERROR_TITLE: 'Could not load developers',
  LIST_ERROR_MESSAGE: 'Check your connection and try again.',
  LOAD_MORE_ERROR: 'Could not load more developers.',
  EMPTY_TITLE: 'No developers yet',
  EMPTY_MESSAGE: 'Developers appear here once they register.',
  NO_MATCH_TITLE: 'No developers match',
  NO_MATCH_MESSAGE: 'Try a different search or status.',
};

// Why an account or game was suspended (`reason` on the status and audit endpoints).
export const REASON_LABELS = {
  non_payment: 'Non-payment',
  abuse: 'Abuse',
  other: 'Other',
};

export const REASON_OPTIONS = [
  { value: '', label: 'Choose a reason' },
  { value: 'non_payment', label: REASON_LABELS.non_payment },
  { value: 'abuse', label: REASON_LABELS.abuse },
  { value: 'other', label: REASON_LABELS.other },
];

export const AUDIT_ACTION_LABELS = {
  'developer.suspended': 'Developer suspended',
  'developer.resumed': 'Developer resumed',
  'game.suspended': 'Game suspended',
  'game.resumed': 'Game resumed',
};

// An audit `actor` that starts with this is automation, not an admin.
export const SYSTEM_ACTOR_PREFIX = 'system:';

export const DETAIL_MESSAGES = {
  BACK_TO_LIST: 'Developers',
  LOADING: 'Loading developer',
  NOT_FOUND_TITLE: 'Developer not found',
  NOT_FOUND_MESSAGE: 'This developer does not exist.',
  BACK_TO_LIST_LINK: 'Back to developers',
  LOAD_ERROR_TITLE: 'Could not load this developer',
  LOAD_ERROR_MESSAGE: 'Check your connection and try again.',
  GAMES_HEADING: 'Games',
  GAMES_EMPTY_TITLE: 'No games',
  GAMES_EMPTY_MESSAGE: 'This developer has not registered a game yet.',
  AUDIT_HEADING: 'Status history',
  AUDIT_NOTE: 'Suspensions and resumptions of the account itself. Changes to a single game are not listed here.',
  AUDIT_LOADING: 'Loading status history',
  AUDIT_ERROR_TITLE: 'Could not load the status history',
  AUDIT_ERROR_MESSAGE: 'Check your connection and try again.',
  AUDIT_LOAD_MORE_ERROR: 'Could not load more history.',
  AUDIT_EMPTY_TITLE: 'No changes yet',
  AUDIT_EMPTY_MESSAGE: 'The status of this account has never been changed.',
};

export const STATUS_MESSAGES = {
  SUSPEND_LABEL: 'Suspend',
  RESUME_LABEL: 'Resume',
  DEVELOPER_SUSPENDED: 'Developer suspended',
  DEVELOPER_RESUMED: 'Developer resumed',
  GAME_SUSPENDED: 'Game suspended',
  GAME_RESUMED: 'Game resumed',
  ERROR_NOT_FOUND: 'This no longer exists. Go back to the list and refresh it.',
  ERROR_REJECTED: 'The server did not accept the reason or note. Check them and try again.',
  ERROR_NETWORK: 'Could not reach the server. Check your connection and try again.',
  ERROR_GENERIC: 'Could not change the status. Nothing was changed. Try again.',
};
