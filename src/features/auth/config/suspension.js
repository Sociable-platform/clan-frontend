import { PRODUCT_NAME } from '@/shared/config';

// What the developer is told, by reason code. Only the code reaches the dashboard: the admin's
// internal note is never part of any developer response, so it cannot be shown here.
export const SUSPENSION_REASON_COPY = {
  non_payment: 'Your account is suspended because of an unpaid balance.',
  abuse: 'Your account is suspended after a violation of the terms of service.',
  other: 'Your account is suspended.',
};

// Used when the reason is not known yet (a suspension just detected) or is a code this version does not know.
export const DEFAULT_SUSPENSION_COPY = SUSPENSION_REASON_COPY.other;

export const SUSPENSION_MESSAGES = {
  BANNER_LABEL: 'Account suspended',
  CONSEQUENCE:
    'You can still view your games, keys and widget settings, but changes are turned off and your games are not served to players.',
  CONTACT_WITH_EMAIL: 'To get access back, contact',
  CONTACT_WITHOUT_EMAIL: `To get access back, contact the ${PRODUCT_NAME} team.`,
  CHECK_AGAIN: 'Check again',
  CHECKING: 'Checking…',
  CHECK_FAILED: 'Could not check your account. Try again.',
  // Shown next to a control that is turned off.
  READ_ONLY: 'Your account is suspended, so changes are turned off.',
};

export function describeSuspension(reasonCode) {
  return SUSPENSION_REASON_COPY[reasonCode] ?? DEFAULT_SUSPENSION_COPY;
}
