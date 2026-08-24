import * as Notifications from 'expo-notifications';
import {
  disableWeeklyReflectionNotification,
  enableWeeklyReflectionNotification,
  getWeeklyReflectionNotificationStatus,
  observeWeeklyReflectionNotificationResponses,
} from '@/platform/notifications/weeklyReflection';

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
const getLastNotificationResponse = jest.mocked(
  Notifications.getLastNotificationResponse,
);
const clearLastNotificationResponse = jest.mocked(
  Notifications.clearLastNotificationResponse,
);
const addNotificationResponseReceivedListener = jest.mocked(
  Notifications.addNotificationResponseReceivedListener,
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

function createNotificationResponse(
  identifier = 'kerjalog-weekly-reflection',
  actionIdentifier = Notifications.DEFAULT_ACTION_IDENTIFIER,
): Notifications.NotificationResponse {
  return {
    actionIdentifier,
    notification: {
      date: 1_776_500_000_000,
      request: {
        identifier,
        content: {
          title: copy.title,
          body: copy.body,
          data: { destination: 'weekly-reflection' },
        },
        trigger: null,
      },
    },
  } as unknown as Notifications.NotificationResponse;
}

describe('weekly reflection notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllScheduledNotificationsAsync.mockResolvedValue([]);
    cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    scheduleNotificationAsync.mockResolvedValue('kerjalog-weekly-reflection');
    getLastNotificationResponse.mockReturnValue(null);
    addNotificationResponseReceivedListener.mockReturnValue({
      remove: jest.fn(),
    });
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
          data: { destination: 'weekly-reflection' },
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

  test('opens reflection from a cold-start weekly reminder response exactly once', () => {
    const response = createNotificationResponse();
    getLastNotificationResponse.mockReturnValue(response);
    const onOpenReflection = jest.fn();

    const unsubscribe =
      observeWeeklyReflectionNotificationResponses(onOpenReflection);

    expect(onOpenReflection).toHaveBeenCalledTimes(1);
    expect(clearLastNotificationResponse).toHaveBeenCalledTimes(1);

    const listener = addNotificationResponseReceivedListener.mock.calls[0]?.[0];
    listener?.(response);

    expect(onOpenReflection).toHaveBeenCalledTimes(1);

    unsubscribe();
    const subscription =
      addNotificationResponseReceivedListener.mock.results[0]?.value;
    expect(subscription?.remove).toHaveBeenCalledTimes(1);
  });

  test('opens reflection when the weekly reminder is tapped while the app is running', () => {
    const onOpenReflection = jest.fn();
    observeWeeklyReflectionNotificationResponses(onOpenReflection);

    const listener = addNotificationResponseReceivedListener.mock.calls[0]?.[0];
    listener?.(createNotificationResponse());

    expect(onOpenReflection).toHaveBeenCalledTimes(1);
  });

  test('ignores notification responses that are not the weekly reminder default action', () => {
    const onOpenReflection = jest.fn();
    observeWeeklyReflectionNotificationResponses(onOpenReflection);

    const listener = addNotificationResponseReceivedListener.mock.calls[0]?.[0];
    listener?.(createNotificationResponse('another-notification'));
    listener?.(
      createNotificationResponse(
        'kerjalog-weekly-reflection',
        'custom-notification-action',
      ),
    );

    expect(onOpenReflection).not.toHaveBeenCalled();
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

  test('reports a persisted reminder as enabled while its native schedule exists', async () => {
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
      'enabled',
    );
  });

  test('cancels the scheduled weekly reminder when disabled', async () => {
    await disableWeeklyReflectionNotification();

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'kerjalog-weekly-reflection',
    );
  });
});
