import { isRunningInExpoGo } from 'expo';
import type { NotificationPermissionsStatus } from 'expo-notifications';
import { Linking, Platform } from 'react-native';

const WEEKLY_REFLECTION_CHANNEL_ID = 'weekly-reflection';
const WEEKLY_REFLECTION_NOTIFICATION_ID = 'kerjalog-weekly-reflection';
const WEEKLY_REFLECTION_WEEKDAY = 6;
const WEEKLY_REFLECTION_HOUR = 16;
const WEEKLY_REFLECTION_MINUTE = 30;
const EXACT_ALARM_SETTINGS_ACTION =
  'android.settings.REQUEST_SCHEDULE_EXACT_ALARM';
const ANDROID_EXACT_ALARM_MIN_API = 31;

type NotificationsModule = typeof import('expo-notifications');

export type WeeklyReflectionEnableResult =
  | 'enabled'
  | 'permission-denied'
  | 'exact-alarm-permission-required'
  | 'unsupported-runtime';

export type WeeklyReflectionNotificationCopy = {
  title: string;
  body: string;
  channelName: string;
};

function isUnsupportedNotificationRuntime(): boolean {
  return Platform.OS === 'android' && isRunningInExpoGo();
}

function loadNotifications(): NotificationsModule | null {
  if (isUnsupportedNotificationRuntime()) {
    return null;
  }

  return require('expo-notifications') as NotificationsModule;
}

function isNotificationPermissionGranted(
  permissions: NotificationPermissionsStatus,
  notifications: NotificationsModule,
): boolean {
  return (
    permissions.granted ||
    permissions.ios?.status === notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

function requiresExactAlarmSpecialAccess(): boolean {
  return (
    Platform.OS === 'android' &&
    Number(Platform.Version) >= ANDROID_EXACT_ALARM_MIN_API
  );
}

function isExactAlarmPermissionError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : String(error);

  return /SCHEDULE_EXACT_ALARM|USE_EXACT_ALARM|exact alarm/i.test(message);
}

async function ensureAndroidNotificationChannel(
  notifications: NotificationsModule,
  channelName: string,
) {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifications.setNotificationChannelAsync(
    WEEKLY_REFLECTION_CHANNEL_ID,
    {
      name: channelName,
      importance: notifications.AndroidImportance.DEFAULT,
    },
  );
}

async function requestNotificationPermissionIfNeeded(
  notifications: NotificationsModule,
): Promise<boolean> {
  const existingPermissions = await notifications.getPermissionsAsync();

  if (isNotificationPermissionGranted(existingPermissions, notifications)) {
    return true;
  }

  if (!existingPermissions.canAskAgain) {
    return false;
  }

  const requestedPermissions = await notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: false,
    },
  });

  return isNotificationPermissionGranted(requestedPermissions, notifications);
}

export async function configureNotificationHandling(): Promise<void> {
  const notifications = loadNotifications();

  if (!notifications) {
    return;
  }

  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function openExactAlarmPermissionSettings(): Promise<void> {
  if (!requiresExactAlarmSpecialAccess()) {
    return;
  }

  try {
    await Linking.sendIntent(EXACT_ALARM_SETTINGS_ACTION);
  } catch {
    await Linking.openSettings();
  }
}

export async function enableWeeklyReflectionNotification(
  copy: WeeklyReflectionNotificationCopy,
): Promise<WeeklyReflectionEnableResult> {
  const notifications = loadNotifications();

  if (!notifications) {
    return 'unsupported-runtime';
  }

  await ensureAndroidNotificationChannel(notifications, copy.channelName);

  const permissionGranted =
    await requestNotificationPermissionIfNeeded(notifications);

  if (!permissionGranted) {
    return 'permission-denied';
  }

  await notifications.cancelScheduledNotificationAsync(
    WEEKLY_REFLECTION_NOTIFICATION_ID,
  );

  try {
    await notifications.scheduleNotificationAsync({
      identifier: WEEKLY_REFLECTION_NOTIFICATION_ID,
      content: {
        title: copy.title,
        body: copy.body,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: WEEKLY_REFLECTION_WEEKDAY,
        hour: WEEKLY_REFLECTION_HOUR,
        minute: WEEKLY_REFLECTION_MINUTE,
        channelId:
          Platform.OS === 'android' ? WEEKLY_REFLECTION_CHANNEL_ID : undefined,
      },
    });
  } catch (error) {
    if (
      requiresExactAlarmSpecialAccess() &&
      isExactAlarmPermissionError(error)
    ) {
      return 'exact-alarm-permission-required';
    }

    throw error;
  }

  return 'enabled';
}

export async function disableWeeklyReflectionNotification(): Promise<void> {
  const notifications = loadNotifications();

  if (!notifications) {
    return;
  }

  await notifications.cancelScheduledNotificationAsync(
    WEEKLY_REFLECTION_NOTIFICATION_ID,
  );
}
