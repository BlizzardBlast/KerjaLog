const mockNotifications = {
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
};

jest.mock('expo-notifications', () => ({
  ...mockNotifications,
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
    mockNotifications.cancelScheduledNotificationAsync.mockResolvedValue(
      undefined,
    );
    mockNotifications.scheduleNotificationAsync.mockResolvedValue(
      'kerjalog-weekly-reflection',
    );
  });

  test('requests permission just in time and schedules Friday at 16:30', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    });
    mockNotifications.requestPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });

    await expect(enableWeeklyReflectionNotification(copy)).resolves.toBe(true);

    expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
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
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    });

    await expect(enableWeeklyReflectionNotification(copy)).resolves.toBe(false);

    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('cancels the scheduled weekly reminder when disabled', async () => {
    await disableWeeklyReflectionNotification();

    expect(
      mockNotifications.cancelScheduledNotificationAsync,
    ).toHaveBeenCalledWith('kerjalog-weekly-reflection');
  });
});
