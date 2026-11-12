/**
 * The JSON shown (and copied) in the Experience config panel, and the config's size in UTF-8 bytes.
 * The JSON is wrapped in a `config` envelope, the shape the platform API sends and receives
 * (`PUT draft` takes `{ config }`, `GET draft` returns `{ config, updatedAt }`), so what is copied can be
 * pasted straight into a request. The size is the config document's own, as the platform counts it: the
 * 64 KB limit is checked on the config JSON as it is sent (compact, no indentation, no envelope), so
 * the pretty-printed text shown here is longer than what counts.
 */
export function describeConfig(config) {
  const bytes = new TextEncoder().encode(JSON.stringify(config)).length;
  return { json: JSON.stringify({ config }, null, 2), bytes };
}

export function formatKilobytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
