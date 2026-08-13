/**
 * History cursor ordering compares persisted timestamps lexicographically in SQLite.
 * Keep every persisted entry timestamp in the canonical UTC representation emitted
 * by Date#toISOString so textual and chronological ordering remain equivalent.
 */
export function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !value) {
    return false;
  }

  const parsed = new Date(value);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}
