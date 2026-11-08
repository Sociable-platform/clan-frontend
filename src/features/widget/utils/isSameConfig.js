const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * True when two config documents hold the same data, whatever the order of their keys (the
 * server stores configs as jsonb, which does not keep the order they were sent in).
 */
export function isSameConfig(first, second) {
  if (Array.isArray(first) && Array.isArray(second)) {
    return first.length === second.length && first.every((item, index) => isSameConfig(item, second[index]));
  }
  if (isPlainObject(first) && isPlainObject(second)) {
    const keys = Object.keys(first);
    return (
      keys.length === Object.keys(second).length &&
      keys.every((key) => Object.hasOwn(second, key) && isSameConfig(first[key], second[key]))
    );
  }
  return first === second;
}
