import { API_ERROR_CODES, ApiError } from '@/shared/api';

import {
  DEFAULT_RULE_MESSAGE,
  RULE_MESSAGES,
  WIDGET_ERROR_CODES,
  WIDGET_MESSAGES,
} from '../config/widgetConfig';
import { WIDGET_SECTIONS } from '../config/widgetSections';

import { isAtOrBelow } from './configPath';

function describeDetail(detail) {
  if (typeof detail.message === 'string' && detail.message.trim() !== '') return detail.message;
  return RULE_MESSAGES[detail.rule] ?? DEFAULT_RULE_MESSAGE;
}

/**
 * A failed save -> what to show. A rejected config (400 invalid_widget_config) becomes
 * `fieldErrors`, one message per JSON Pointer path; anything else becomes one `formError`.
 */
export function mapSaveDraftError(error) {
  if (!(error instanceof ApiError)) return { fieldErrors: {}, formError: WIDGET_MESSAGES.GENERIC_SAVE_ERROR };

  if (error.code === WIDGET_ERROR_CODES.INVALID_CONFIG) {
    const fieldErrors = {};
    error.details.forEach((detail) => {
      if (typeof detail?.path !== 'string' || detail.path in fieldErrors) return;
      fieldErrors[detail.path] = describeDetail(detail);
    });
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;
    return { fieldErrors, formError: hasFieldErrors ? null : WIDGET_MESSAGES.NOT_ACCEPTED };
  }

  if (error.code === WIDGET_ERROR_CODES.GAME_NOT_FOUND) return { fieldErrors: {}, formError: WIDGET_MESSAGES.GAME_GONE };
  if (error.code === API_ERROR_CODES.NETWORK) return { fieldErrors: {}, formError: error.message };
  return { fieldErrors: {}, formError: WIDGET_MESSAGES.GENERIC_SAVE_ERROR };
}

/** The message for the field at `pointer`: an error on it, or on anything below it. */
export function findFieldError(fieldErrors, pointer) {
  const path = Object.keys(fieldErrors).find((candidate) => isAtOrBelow(candidate, pointer));
  return path === undefined ? null : fieldErrors[path];
}

/** The section that shows an error path, or null when no field of the form has that path. */
export function sectionOfPath(path) {
  const section = WIDGET_SECTIONS.find((candidate) =>
    candidate.prefixes.some((prefix) => (prefix === '' ? path === '' : isAtOrBelow(path, prefix))),
  );
  return section?.id ?? null;
}

/** Drops the errors for an edited field (and the root tab rule, which any edit may fix). */
export function clearFieldErrors(fieldErrors, pointer) {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter(([path]) => path !== '' && !isAtOrBelow(path, pointer)),
  );
}

/** Per-section error counts and the errors that no section shows (listed at the top instead). */
export function groupErrorsBySection(fieldErrors) {
  const counts = Object.fromEntries(WIDGET_SECTIONS.map((section) => [section.id, 0]));
  const unplaced = [];
  Object.entries(fieldErrors).forEach(([path, message]) => {
    const sectionId = sectionOfPath(path);
    if (sectionId) counts[sectionId] += 1;
    else unplaced.push({ path, message });
  });
  return { counts, unplaced };
}
