import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export type WeeklyReminderPrecision = 'exact' | 'inexact';

type ExactAlarmAccessNativeModule = {
  canScheduleExactAlarms(): boolean;
};

const exactAlarmAccessModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<ExactAlarmAccessNativeModule>(
        'KerjaLogAlarmPermissions',
      )
    : null;

export function getWeeklyReminderPrecision(): WeeklyReminderPrecision {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 31) {
    return 'exact';
  }

  return exactAlarmAccessModule?.canScheduleExactAlarms() ? 'exact' : 'inexact';
}
