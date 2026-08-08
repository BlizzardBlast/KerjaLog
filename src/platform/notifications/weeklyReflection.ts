import * as Notifications from 'expo-notifications';

const WEEKLY_REFLECTION_CHANNEL_ID = 'weekly-reflection';
const WEEKLY_REFLECTION_NOTIFICATION_ID = 'kerjalog-weekly-reflection';
const WEEKLY_REFLECTION_WEEKDAY = 6;
const WEEKLY_REFLECTION_HOUR = 16;
const WEEKLY_REFLECTION_MINUTE = 30;

export type WeeklyReflectionNotificationCopy = {
  title: string;
  body: string;
  channelName: string;
};

function isNotificationPermissionGranted(
  permissions: Notifications.NotificationPermissionsStatus,
): boolean {
  return (
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensureAndroidNotificationChannel(channelName: string) {
  if (process.env.EXPO_OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    WEEKLY_REFLECTION_CHANNEL_ID,
    {
      name: channelName,
      importance: Notifications.AndroidImportance.DEFAULT,
    },
  );
}

async function requestNotificationPermissionIfNeeded(): Promise<boolean> {
  const existingPermissions = await Notifications.getPermissionsAsync();

  if (isNotificationPermissionGranted(existingPermissions)) {
    return true;
  }

  if (!existingPermissions.canAskAgain) {
    return false;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: false,
    },
  });

  return isNotificationPermissionGranted(requestedPermissions);
}

export function configureNotificationHandling() {
  Notifications.setNotificationHandler({
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
): Promise<boolean> {
  await ensureAndroidNotificationChannel(copy.channelName);

  const permissionGranted = await requestNotificationPermissionIfNeeded();

  if (!permissionGranted) {
    return false;
  }

  await Notifications.cancelScheduledNotificationAsync(
    WEEKLY_REFLECTION_NOTIFICATION_ID,
  );

  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_REFLECTION_NOTIFICATION_ID,
    content: {
      title: copy.title,
      body: copy.body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: WEEKLY_REFLECTION_WEEKDAY,
      hour: WEEKLY_REFLECTION_HOUR,
      minute: WEEKLY_REFLECTION_MINUTE,
      channelId:
        process.env.EXPO_OS === 'android'
          ? WEEKLY_REFLECTION_CHANNEL_ID
          : undefined,
    },
  });

  return true;
}

export async function disableWeeklyReflectionNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(
    WEEKLY_REFLECTION_NOTIFICATION_ID,
  );
}
