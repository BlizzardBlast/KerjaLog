const notifications = {
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
};

jest.mock('expo-notifications', () => ({
  ...notifications,
  AndroidImportance: { DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
}));

import {
  disableWeeklyReflectionNotification,
  enableWeeklyReflectionNotification,
} from '@/platform/notifications/weeklyReflection';

const copy = {
  title: 'A gentle weekly check-in',
  body: 'What moved forward this week?',
  channelName: 'Weekly reflection',
};

describe('weekly reflection notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    notifications.scheduleNotificationAsync.mockResolvedValue(
      'kerjalog-weekly-reflection',
    );
  });

  test('requests permission just in time and schedules Friday at 16:30', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    });
    notifications.requestPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });

    await expect(enableWeeklyReflectionNotification(copy)).resolves.toBe(true);

    expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'kerjalog-weekly-reflection',
        content: {
          title: copy.title,
          body: copy.body,
        },
        trigger: expect.objectContaining({
          type: 'weekly',
          weekday: 6,
          hour: 16,
          minute: 30,
        }),
      }),
    );
  });

  test('does not schedule when permission cannot be granted', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    });

    await expect(enableWeeklyReflectionNotification(copy)).resolves.toBe(false);

    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('cancels the scheduled weekly reminder when disabled', async () => {
    await disableWeeklyReflectionNotification();

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'kerjalog-weekly-reflection',
    );
  });
});
