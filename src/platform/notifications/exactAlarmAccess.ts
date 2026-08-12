import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import type { ReminderPrecision } from '@/domain/reminder/model';

type ExactAlarmAccessNativeModule = {
  canScheduleExactAlarms(): boolean;
};

const exactAlarmAccessModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<ExactAlarmAccessNativeModule>(
        'KerjaLogAlarmPermissions',
      )
    : null;

export function getWeeklyReminderPrecision(): ReminderPrecision {
  return resolveWeeklyReminderPrecision(
    Platform.OS,
    Number(Platform.Version),
    exactAlarmAccessModule?.canScheduleExactAlarms() ?? false,
  );
}

export function resolveWeeklyReminderPrecision(
  platform: string,
  platformVersion: number,
  canScheduleExactAlarms: boolean,
): ReminderPrecision {
  if (platform !== 'android' || platformVersion < 31) {
    return 'exact';
  }

  return canScheduleExactAlarms ? 'exact' : 'inexact';
}
