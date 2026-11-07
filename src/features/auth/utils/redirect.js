/**
 * Only same-origin absolute paths are valid redirect targets; anything else
 * (`//evil.example`, `https://...`, non-strings) falls back.
 */
export function getSafeRedirectPath(candidate, fallback) {
  const isLocalPath =
    typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//');
  return isLocalPath ? candidate : fallback;
}
