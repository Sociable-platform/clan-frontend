/** Copy of `object` without `key`. */
export function omitKey(object, key) {
  const copy = { ...object };
  delete copy[key];
  return copy;
}
