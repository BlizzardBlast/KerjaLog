import type {
  ReminderWeekday,
  WeeklyReminderSchedule,
} from '@/features/onboarding/model';
import type { Language } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/catalog';

export const reminderWeekdayTranslationKeys: Record<
  ReminderWeekday,
  TranslationKey
> = {
  1: 'weekday.sunday',
  2: 'weekday.monday',
  3: 'weekday.tuesday',
  4: 'weekday.wednesday',
  5: 'weekday.thursday',
  6: 'weekday.friday',
  7: 'weekday.saturday',
};

export function createReminderTimeDate(
  schedule: WeeklyReminderSchedule,
  baseDate = new Date(),
): Date {
  const date = new Date(baseDate);
  date.setHours(schedule.hour, schedule.minute, 0, 0);
  return date;
}

export function withReminderTime(
  schedule: WeeklyReminderSchedule,
  date: Date,
): WeeklyReminderSchedule {
  return {
    ...schedule,
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export function formatReminderTime(
  schedule: WeeklyReminderSchedule,
  language: Language,
): string {
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(createReminderTimeDate(schedule));
  } catch {
    return `${String(schedule.hour).padStart(2, '0')}:${String(
      schedule.minute,
    ).padStart(2, '0')}`;
  }
}
