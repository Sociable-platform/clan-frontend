// Limits and codes copied from openapi/platform.yaml (listAdminDevelopers).
export const ADMIN_LIMITS = {
  SEARCH_MAX: 100,
  PAGE_SIZE: 25,
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
