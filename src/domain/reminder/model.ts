export const REMINDER_PRECISIONS = ['exact', 'inexact'] as const;

export type ReminderPrecision = (typeof REMINDER_PRECISIONS)[number];

export function isReminderPrecision(value: unknown): value is ReminderPrecision {
  return (
    typeof value === 'string' &&
    REMINDER_PRECISIONS.includes(value as ReminderPrecision)
  );
}
