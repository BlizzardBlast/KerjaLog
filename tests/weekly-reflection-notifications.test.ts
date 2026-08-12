import * as Notifications from 'expo-notifications';
import { getWeeklyReminderPrecision } from '@/platform/notifications/exactAlarmAccess';
import {
  disableWeeklyReflectionNotification,
  enableWeeklyReflectionNotification,
  getWeeklyReflectionNotificationStatus,
} from '@/platform/notifications/weeklyReflection';

jest.mock('@/platform/notifications/exactAlarmAccess', () => ({
  getWeeklyReminderPrecision: jest.fn(),
}));

const getWeeklyReminderPrecisionMock = jest.mocked(getWeeklyReminderPrecision);
const getPermissionsAsync = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissionsAsync = jest.mocked(
  Notifications.requestPermissionsAsync,
);
const getAllScheduledNotificationsAsync = jest.mocked(
  Notifications.getAllScheduledNotificationsAsync,
);
const cancelScheduledNotificationAsync = jest.mocked(
  Notifications.cancelScheduledNotificationAsync,
);
const scheduleNotificationAsync = jest.mocked(
  Notifications.scheduleNotificationAsync,
);

const copy = {
  title: 'A gentle weekly check-in',
  body: 'What moved forward this week?',
  channelName: 'Weekly reflection',
};

const defaultSchedule = {
  weekday: 6 as const,
  hour: 16,
  minute: 30,
};

describe('weekly reflection notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getWeeklyReminderPrecisionMock.mockReturnValue('exact');
    getAllScheduledNotificationsAsync.mockResolvedValue([]);
    cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    scheduleNotificationAsync.mockResolvedValue('kerjalog-weekly-reflection');
  });

  test('requests permission just in time and schedules the selected weekly time', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    requestPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);

    const schedule = {
      weekday: 3 as const,
      hour: 18,
      minute: 15,
    };

    await expect(
      enableWeeklyReflectionNotification({ schedule, copy }),
    ).resolves.toBe('enabled-exact');

    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'kerjalog-weekly-reflection',
        content: {
          title: copy.title,
          body: copy.body,
        },
        trigger: expect.objectContaining({
          type: 'weekly',
          weekday: schedule.weekday,
          hour: schedule.hour,
          minute: schedule.minute,
        }),
      }),
    );
  });

  test('keeps the reminder scheduled with inexact delivery when exact access is unavailable', async () => {
    getWeeklyReminderPrecisionMock.mockReturnValue('inexact');
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);

    await expect(
      enableWeeklyReflectionNotification({ schedule: defaultSchedule, copy }),
    ).resolves.toBe('enabled-inexact');

    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  test('does not schedule when notification permission cannot be granted', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as Notifications.NotificationPermissionsStatus);

    await expect(
      enableWeeklyReflectionNotification({ schedule: defaultSchedule, copy }),
    ).resolves.toBe('permission-denied');

    expect(requestPermissionsAsync).not.toHaveBeenCalled();
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('reports a persisted reminder as disabled when notification permission is gone', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as Notifications.NotificationPermissionsStatus);

    await expect(getWeeklyReflectionNotificationStatus()).resolves.toBe(
      'disabled',
    );

    expect(getAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });

  test('reports a persisted reminder as disabled when its native schedule is gone', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    getAllScheduledNotificationsAsync.mockResolvedValue([]);

    await expect(getWeeklyReflectionNotificationStatus()).resolves.toBe(
      'disabled',
    );
  });

  test('reports the current precision while the native schedule exists', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'kerjalog-weekly-reflection',
        content: {},
        trigger: null,
      },
    ] as Notifications.NotificationRequest[]);

    await expect(getWeeklyReflectionNotificationStatus()).resolves.toBe(
      'enabled-exact',
    );

    getWeeklyReminderPrecisionMock.mockReturnValue('inexact');

    await expect(getWeeklyReflectionNotificationStatus()).resolves.toBe(
      'enabled-inexact',
    );
  });

  test('cancels the scheduled weekly reminder when disabled', async () => {
    await disableWeeklyReflectionNotification();

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'kerjalog-weekly-reflection',
    );
  });
});
