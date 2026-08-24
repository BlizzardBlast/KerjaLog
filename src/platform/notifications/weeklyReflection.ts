import { isRunningInExpoGo } from 'expo';
import type {
  NotificationPermissionsStatus,
  NotificationResponse,
} from 'expo-notifications';
import { Platform } from 'react-native';
import type { WeeklyReminderSchedule } from '@/features/onboarding/model';

const WEEKLY_REFLECTION_CHANNEL_ID = 'weekly-reflection';
const WEEKLY_REFLECTION_NOTIFICATION_ID = 'kerjalog-weekly-reflection';
const WEEKLY_REFLECTION_DESTINATION = 'weekly-reflection';

type NotificationsModule = typeof import('expo-notifications');

export type WeeklyReflectionEnableResult =
  | 'enabled'
  | 'permission-denied'
  | 'unsupported-runtime';

export type WeeklyReflectionNotificationStatus =
  | 'enabled'
  | 'disabled'
  | 'unsupported-runtime';

export type WeeklyReflectionNotificationCopy = {
  title: string;
  body: string;
  channelName: string;
};

export type WeeklyReflectionNotificationRequest = {
  schedule: WeeklyReminderSchedule;
  copy: WeeklyReflectionNotificationCopy;
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

function isWeeklyReflectionResponse(
  response: NotificationResponse,
  notifications: NotificationsModule,
): boolean {
  const request = response.notification.request;
  const destination = request.content.data?.destination;

  return (
    response.actionIdentifier === notifications.DEFAULT_ACTION_IDENTIFIER &&
    request.identifier === WEEKLY_REFLECTION_NOTIFICATION_ID &&
    (destination === undefined || destination === WEEKLY_REFLECTION_DESTINATION)
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

export function observeWeeklyReflectionNotificationResponses(
  onOpenReflection: () => void,
): () => void {
  const notifications = loadNotifications();

  if (!notifications) {
    return () => undefined;
  }

  const handledResponses = new Set<string>();
  const consumeResponse = (response: NotificationResponse): void => {
    if (!isWeeklyReflectionResponse(response, notifications)) {
      return;
    }

    const responseKey = `${response.notification.request.identifier}:${response.notification.date}:${response.actionIdentifier}`;
    if (!handledResponses.has(responseKey)) {
      handledResponses.add(responseKey);
      onOpenReflection();
    }

    notifications.clearLastNotificationResponse();
  };

  const subscription = notifications.addNotificationResponseReceivedListener(
    consumeResponse,
  );
  const initialResponse = notifications.getLastNotificationResponse();

  if (initialResponse) {
    consumeResponse(initialResponse);
  }

  return () => subscription.remove();
}

export async function getWeeklyReflectionNotificationStatus(): Promise<WeeklyReflectionNotificationStatus> {
  const notifications = loadNotifications();

  if (!notifications) {
    return 'unsupported-runtime';
  }

  const permissions = await notifications.getPermissionsAsync();

  if (!isNotificationPermissionGranted(permissions, notifications)) {
    return 'disabled';
  }

  const scheduledNotifications =
    await notifications.getAllScheduledNotificationsAsync();
  const isScheduled = scheduledNotifications.some(
    (request) => request.identifier === WEEKLY_REFLECTION_NOTIFICATION_ID,
  );

  return isScheduled ? 'enabled' : 'disabled';
}

export async function enableWeeklyReflectionNotification({
  schedule,
  copy,
}: WeeklyReflectionNotificationRequest): Promise<WeeklyReflectionEnableResult> {
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

  await notifications.scheduleNotificationAsync({
    identifier: WEEKLY_REFLECTION_NOTIFICATION_ID,
    content: {
      title: copy.title,
      body: copy.body,
      data: { destination: WEEKLY_REFLECTION_DESTINATION },
    },
    trigger: {
      type: notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: schedule.weekday,
      hour: schedule.hour,
      minute: schedule.minute,
      ...(Platform.OS === 'android'
        ? { channelId: WEEKLY_REFLECTION_CHANNEL_ID }
        : {}),
    },
  });

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
