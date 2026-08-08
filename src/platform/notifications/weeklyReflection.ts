import { isRunningInExpoGo } from 'expo';
import type { NotificationPermissionsStatus } from 'expo-notifications';
import { Platform } from 'react-native';

const WEEKLY_REFLECTION_CHANNEL_ID = 'weekly-reflection';
const WEEKLY_REFLECTION_NOTIFICATION_ID = 'kerjalog-weekly-reflection';
const WEEKLY_REFLECTION_WEEKDAY = 6;
const WEEKLY_REFLECTION_HOUR = 16;
const WEEKLY_REFLECTION_MINUTE = 30;

type NotificationsModule = typeof import('expo-notifications');

export type WeeklyReflectionEnableResult =
  | 'enabled'
  | 'permission-denied'
  | 'unsupported-runtime';

export type WeeklyReflectionNotificationCopy = {
  title: string;
  body: string;
  channelName: string;
};

function isUnsupportedNotificationRuntime(): boolean {
  return (
    Platform.OS === 'web' ||
    (Platform.OS === 'android' && isRunningInExpoGo())
  );
}

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (isUnsupportedNotificationRuntime()) {
    return null;
  }

  return import('expo-notifications');
}

function isNotificationPermissionGranted(
  permissions: NotificationPermissionsStatus,
  notifications: NotificationsModule,
): boolean {
  return (
    permissions.granted ||
    permissions.ios?.status ===
      notifications.IosAuthorizationStatus.PROVISIONAL
  );
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
  const notifications = await loadNotifications();

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

export async function enableWeeklyReflectionNotification(
  copy: WeeklyReflectionNotificationCopy,
): Promise<WeeklyReflectionEnableResult> {
  const notifications = await loadNotifications();

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
        Platform.OS === 'android'
          ? WEEKLY_REFLECTION_CHANNEL_ID
          : undefined,
    },
  });

  return 'enabled';
}

export async function disableWeeklyReflectionNotification(): Promise<void> {
  const notifications = await loadNotifications();

  if (!notifications) {
    return;
  }

  await notifications.cancelScheduledNotificationAsync(
    WEEKLY_REFLECTION_NOTIFICATION_ID,
  );
}
