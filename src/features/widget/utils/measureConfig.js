/** The pretty JSON shown in the Advanced view and its size in UTF-8 bytes (the 64 KB limit counts bytes). */
export function describeConfig(config) {
  const json = JSON.stringify(config, null, 2);
  return { json, bytes: new TextEncoder().encode(json).length };
}

export function formatKilobytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
