/**
 * Reads the token from the fragment of a reset link (`/reset-password#token=...`). The token is in
 * the fragment, not the query, because browsers never send a fragment to a server.
 */
export function readResetToken(hash) {
  return new URLSearchParams(String(hash ?? '').replace(/^#/, '')).get('token') ?? '';
}
