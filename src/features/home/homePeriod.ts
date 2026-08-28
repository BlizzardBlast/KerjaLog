export function getStartOfLocalWeekIso(now: Date = new Date()): string {
  if (Number.isNaN(now.getTime())) {
    throw new TypeError('Current date must be valid.');
  }

  const start = new Date(now);
  const daysSinceMonday = (start.getDay() + 6) % 7;

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceMonday);

  return start.toISOString();
}
