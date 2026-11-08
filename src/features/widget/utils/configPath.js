// Server errors and form fields address the config by JSON Pointer ("/clan/maxMembers",
// "" for the whole document). These helpers read and update the config immutably.

const unescapeSegment = (segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~');

export function toSegments(pointer) {
  return pointer === '' ? [] : pointer.slice(1).split('/').map(unescapeSegment);
}

export function getIn(source, pointer) {
  return toSegments(pointer).reduce((node, segment) => (node == null ? undefined : node[segment]), source);
}

function assoc(node, segments, value) {
  if (segments.length === 0) return value;
  const [head, ...rest] = segments;
  const copy = Array.isArray(node) ? [...node] : { ...node };
  copy[head] = assoc(node?.[head], rest, value);
  return copy;
}

/** A copy of `source` with `value` at `pointer`; objects on the way are created when missing. */
export function setIn(source, pointer, value) {
  return assoc(source, toSegments(pointer), value);
}

/** A copy of `source` without the key at `pointer`; the same object when it is not there. */
export function removeIn(source, pointer) {
  const segments = toSegments(pointer);
  const key = segments.pop();
  const parent = segments.reduce((node, segment) => (node == null ? undefined : node[segment]), source);
  if (parent == null || !Object.hasOwn(parent, key)) return source;

  const rest = { ...parent };
  delete rest[key];
  return assoc(source, segments, rest);
}

/** True when `path` is `pointer` itself or lies below it. The root pointer matches only the root. */
export function isAtOrBelow(path, pointer) {
  if (pointer === '') return path === '';
  return path === pointer || path.startsWith(`${pointer}/`);
}
