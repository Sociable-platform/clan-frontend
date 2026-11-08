import { ROLE_MESSAGES, ROLE_NAME_FORBIDDEN } from '../config/widgetRoles';
import { WIDGET_LIMITS } from '../config/widgetConfig';

/** What is wrong with a role title, or null. The server checks the same rules; this saves a round trip while typing. */
export function roleNameProblem(name) {
  const trimmed = String(name ?? '').trim();
  if (trimmed === '') return ROLE_MESSAGES.NAME_EMPTY;
  if (trimmed.length > WIDGET_LIMITS.ROLE_NAME_MAX) return ROLE_MESSAGES.NAME_TOO_LONG(WIDGET_LIMITS.ROLE_NAME_MAX);
  if (ROLE_NAME_FORBIDDEN.test(trimmed)) return ROLE_MESSAGES.NAME_FORBIDDEN;
  return null;
}

/**
 * The stable id for a new role, made from its title: `Co-Leader` becomes `co-leader`. It starts with a
 * letter, is at most 24 characters and differs from every id in `takenIds` (a number is added if needed).
 */
export function roleIdFromName(name, takenIds = []) {
  const slug = String(name)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = (/^[a-z]/.test(slug) ? slug : `role-${slug}`).slice(0, WIDGET_LIMITS.ROLE_ID_MAX).replace(/-+$/, '') || 'role';
  const taken = new Set(takenIds);
  let candidate = base;
  for (let counter = 2; taken.has(candidate); counter += 1) {
    const suffix = `-${counter}`;
    candidate = `${base.slice(0, WIDGET_LIMITS.ROLE_ID_MAX - suffix.length).replace(/-+$/, '')}${suffix}`;
  }
  return candidate;
}

/** A new role goes just below the owner's, with no powers; the owner role stays last. */
export function addRole(roles, name) {
  const role = { id: roleIdFromName(name, roles.map((entry) => entry.id)), name: name.trim(), canPromote: false, canKick: false };
  return [...roles.slice(0, -1), role, roles.at(-1)];
}

export const removeRole = (roles, index) => roles.filter((_, position) => position !== index);

/**
 * Move the role at `from` to position `to` (positions count from the lowest role). The lowest role and the
 * owner role stay where they are: they cannot be moved, and a role dropped on either lands next to it
 * instead. Returns the same list when nothing changes.
 */
export function reorderRole(roles, from, to) {
  const last = roles.length - 1;
  if (from <= 0 || from >= last) return roles;
  const target = Math.min(Math.max(to, 1), last - 1);
  if (target === from) return roles;
  const next = [...roles];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  return next;
}

/** One step: `delta` +1 gives the role more power, -1 less. */
export const moveRole = (roles, index, delta) => reorderRole(roles, index, index + delta);

export const setRolePower = (roles, index, power, value) => roles.map((role, position) => (position === index ? { ...role, [power]: value } : role));
