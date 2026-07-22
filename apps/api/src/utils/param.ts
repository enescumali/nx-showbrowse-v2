/** Express types route params/query values as possibly `string[]` (repeated
 * keys); every route here expects a single value, so take the first. */
export function paramToString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

/** undefined = absent; NaN = present but not a valid integer (caller 400s). */
export function parseIntParam(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}
