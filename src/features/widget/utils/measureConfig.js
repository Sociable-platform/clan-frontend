/**
 * The JSON shown (and copied) in the Experience config panel, and the config's size in UTF-8 bytes.
 * The JSON is wrapped in a `config` envelope, the shape the platform API sends and receives
 * (`PUT draft` takes `{ config }`, `GET draft` returns `{ config, updatedAt }`), so what is copied can be
 * pasted straight into a request. The size is the config document's own: the 64 KB limit counts the
 * config, not the envelope around it.
 */
export function describeConfig(config) {
  const bytes = new TextEncoder().encode(JSON.stringify(config, null, 2)).length;
  return { json: JSON.stringify({ config }, null, 2), bytes };
}

export function formatKilobytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
