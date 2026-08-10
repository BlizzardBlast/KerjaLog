import {
  createReminderTimeDate,
  withReminderTime,
} from '@/features/onboarding/reminderSchedule';

const schedule = {
  weekday: 6 as const,
  hour: 16,
  minute: 30,
};

describe('reminder schedule helpers', () => {
  test('creates picker dates in local wall-clock time', () => {
    const baseDate = new Date(2026, 7, 9, 8, 5, 44, 900);
    const date = createReminderTimeDate(schedule, baseDate);

    expect(date.getFullYear()).toBe(baseDate.getFullYear());
    expect(date.getMonth()).toBe(baseDate.getMonth());
    expect(date.getDate()).toBe(baseDate.getDate());
    expect(date.getHours()).toBe(16);
    expect(date.getMinutes()).toBe(30);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  test('updates only the time portion of a weekly schedule', () => {
    const selectedDate = new Date(2026, 7, 9, 9, 45);

    expect(withReminderTime(schedule, selectedDate)).toEqual({
      weekday: 6,
      hour: 9,
      minute: 45,
    });
  });
});
