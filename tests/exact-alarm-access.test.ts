import { resolveWeeklyReminderPrecision } from '@/platform/notifications/exactAlarmAccess';

describe('weekly reminder precision', () => {
  test('uses exact scheduling when Android special access is available', () => {
    expect(resolveWeeklyReminderPrecision('android', 36, true)).toBe('exact');
  });

  test('falls back to inexact scheduling on Android 12+ without special access', () => {
    expect(resolveWeeklyReminderPrecision('android', 36, false)).toBe(
      'inexact',
    );
  });

  test('does not require exact-alarm special access before Android 12', () => {
    expect(resolveWeeklyReminderPrecision('android', 30, false)).toBe('exact');
  });

  test('treats iOS weekly calendar scheduling as exact mode', () => {
    expect(resolveWeeklyReminderPrecision('ios', 26, false)).toBe('exact');
  });
});
