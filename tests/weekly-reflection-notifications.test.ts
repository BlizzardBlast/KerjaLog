import * as Notifications from 'expo-notifications';
import {
  disableWeeklyReflectionNotification,
  enableWeeklyReflectionNotification,
} from '@/platform/notifications/weeklyReflection';

const getPermissionsAsync = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissionsAsync = jest.mocked(
  Notifications.requestPermissionsAsync,
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
    ).resolves.toBe('enabled');

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

  test('does not schedule when permission cannot be granted', async () => {
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

  test('cancels the scheduled weekly reminder when disabled', async () => {
    await disableWeeklyReflectionNotification();

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'kerjalog-weekly-reflection',
    );
  });
});
