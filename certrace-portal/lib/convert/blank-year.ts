/** A year nobody has started: the store marks it blank, or it holds no answers at all. */
export function isBlankYear(
  stored: object | null | undefined,
  meta: { blank?: boolean } | undefined,
): boolean {
  return Boolean(meta?.blank) || Object.keys(stored ?? {}).length === 0;
}
