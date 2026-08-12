import { act, renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import type { PropsWithChildren } from 'react';
import { DEFAULT_ONBOARDING_STATE } from '@/features/onboarding/model';
import { useWeeklyReminderController } from '@/features/onboarding/useWeeklyReminderController';
import { I18nProvider } from '@/i18n/I18nProvider';
import { getWeeklyReminderPrecision } from '@/platform/notifications/exactAlarmAccess';

jest.mock('@/platform/notifications/exactAlarmAccess', () => ({
  getWeeklyReminderPrecision: jest.fn(),
}));

const getWeeklyReminderPrecisionMock = jest.mocked(getWeeklyReminderPrecision);
const getPermissionsAsync = jest.mocked(Notifications.getPermissionsAsync);
const cancelScheduledNotificationAsync = jest.mocked(
  Notifications.cancelScheduledNotificationAsync,
);
const scheduleNotificationAsync = jest.mocked(
  Notifications.scheduleNotificationAsync,
);

function wrapper({ children }: PropsWithChildren) {
  return <I18nProvider>{children}</I18nProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  getWeeklyReminderPrecisionMock.mockReturnValue('exact');
  cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  scheduleNotificationAsync.mockResolvedValue('kerjalog-weekly-reflection');
});

describe('weekly reminder controller', () => {
  test('editing the schedule while disabled only stores the preference', async () => {
    const update = jest.fn();
    const state = DEFAULT_ONBOARDING_STATE;
    const nextSchedule = {
      weekday: 2 as const,
      hour: 9,
      minute: 15,
    };
    const { result } = await renderHook(
      () => useWeeklyReminderController(state, update),
      { wrapper },
    );

    await act(async () => {
      await result.current.setSchedule(nextSchedule);
    });

    expect(update).toHaveBeenCalledWith({
      weeklyReminderSchedule: nextSchedule,
    });
    expect(getPermissionsAsync).not.toHaveBeenCalled();
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('editing an enabled reminder reschedules and records exact precision', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);

    const update = jest.fn();
    const state = {
      ...DEFAULT_ONBOARDING_STATE,
      weeklyReminderEnabled: true,
      weeklyReminderPrecision: 'exact' as const,
    };
    const nextSchedule = {
      weekday: 4 as const,
      hour: 17,
      minute: 45,
    };
    const { result } = await renderHook(
      () => useWeeklyReminderController(state, update),
      { wrapper },
    );

    await act(async () => {
      await result.current.setSchedule(nextSchedule);
    });

    expect(update).toHaveBeenNthCalledWith(1, {
      weeklyReminderSchedule: nextSchedule,
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      weeklyReminderEnabled: true,
      weeklyReminderPrecision: 'exact',
    });
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          weekday: 4,
          hour: 17,
          minute: 45,
        }),
      }),
    );
    expect(result.current.feedback).toEqual({
      issue: null,
      isUpdating: false,
    });
  });

  test('keeps an enabled reminder in inexact mode without treating it as a failure', async () => {
    getWeeklyReminderPrecisionMock.mockReturnValue('inexact');
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);

    const update = jest.fn();
    const { result } = await renderHook(
      () => useWeeklyReminderController(DEFAULT_ONBOARDING_STATE, update),
      { wrapper },
    );

    await act(async () => {
      await result.current.setEnabled(true);
    });

    expect(update).toHaveBeenCalledWith({
      weeklyReminderEnabled: true,
      weeklyReminderPrecision: 'inexact',
    });
    expect(result.current.feedback).toEqual({
      issue: null,
      isUpdating: false,
    });
  });

  test('failed rescheduling preserves the desired schedule but disables the reminder', async () => {
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    scheduleNotificationAsync.mockRejectedValueOnce(
      new Error('native scheduler unavailable'),
    );

    const update = jest.fn();
    const state = {
      ...DEFAULT_ONBOARDING_STATE,
      weeklyReminderEnabled: true,
      weeklyReminderPrecision: 'exact' as const,
    };
    const nextSchedule = {
      weekday: 7 as const,
      hour: 10,
      minute: 0,
    };
    const { result } = await renderHook(
      () => useWeeklyReminderController(state, update),
      { wrapper },
    );

    await act(async () => {
      await result.current.setSchedule(nextSchedule);
    });

    expect(update).toHaveBeenNthCalledWith(1, {
      weeklyReminderSchedule: nextSchedule,
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      weeklyReminderEnabled: false,
      weeklyReminderPrecision: null,
    });
    expect(result.current.feedback).toEqual({
      issue: 'setup',
      isUpdating: false,
    });
  });
});
