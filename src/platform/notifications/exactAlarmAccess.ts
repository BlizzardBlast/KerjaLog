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
  if (Platform.OS !== 'android' || Number(Platform.Version) < 31) {
    return 'exact';
  }

  return exactAlarmAccessModule?.canScheduleExactAlarms() ? 'exact' : 'inexact';
}
