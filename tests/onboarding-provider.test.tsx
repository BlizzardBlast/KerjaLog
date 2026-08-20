import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import type { PropsWithChildren } from 'react';
import { DEFAULT_ONBOARDING_STATE } from '@/features/onboarding/model';
import { OnboardingProvider } from '@/features/onboarding/OnboardingProvider';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { I18nProvider } from '@/i18n/I18nProvider';
const getItemMock = jest.mocked(AsyncStorage.getItem);
const setItemMock = jest.mocked(AsyncStorage.setItem);
const getPermissionsAsync = jest.mocked(Notifications.getPermissionsAsync);
const getAllScheduledNotificationsAsync = jest.mocked(
  Notifications.getAllScheduledNotificationsAsync,
);
const cancelScheduledNotificationAsync = jest.mocked(
  Notifications.cancelScheduledNotificationAsync,
);
const scheduleNotificationAsync = jest.mocked(
  Notifications.scheduleNotificationAsync,
);

function wrapper({ children }: PropsWithChildren) {
  return (
    <I18nProvider>
      <OnboardingProvider>{children}</OnboardingProvider>
    </I18nProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  scheduleNotificationAsync.mockResolvedValue('kerjalog-weekly-reflection');
});

describe('OnboardingProvider', () => {
  test('recovers from a failed autosave and completes authoritatively', async () => {
    getItemMock.mockResolvedValueOnce(null);
    setItemMock
      .mockRejectedValueOnce(new Error('autosave unavailable'))
      .mockResolvedValue(undefined);

    const { result } = await renderHook(() => useOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    expect(setItemMock).not.toHaveBeenCalled();

    await act(async () => {
      result.current.update({ workArea: 'technology-product' });
    });

    await waitFor(() => {
      expect(setItemMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.update({
        careerLevel: 'junior-contributor',
        mainGoal: 'performance-review',
        reviewSchedule: 'within-3-months',
      });
    });

    await waitFor(() => {
      expect(setItemMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      await result.current.complete();
    });

    expect(result.current.state.completed).toBe(true);
    expect(setItemMock).toHaveBeenCalledTimes(3);
  });

  test('rejects completion when required answers are missing', async () => {
    getItemMock.mockResolvedValueOnce(null);

    const { result } = await renderHook(() => useOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    await expect(result.current.complete()).rejects.toThrow(
      'Cannot complete onboarding without required answers.',
    );
  });

  test('turns off a persisted reminder when its native schedule no longer exists', async () => {
    getItemMock.mockResolvedValueOnce(
      JSON.stringify({
        ...DEFAULT_ONBOARDING_STATE,
        weeklyReminderEnabled: true,
      }),
    );
    setItemMock.mockResolvedValue(undefined);
    getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Notifications.NotificationPermissionsStatus);
    getAllScheduledNotificationsAsync.mockResolvedValue([]);

    const { result } = await renderHook(() => useOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
      expect(result.current.state.weeklyReminderEnabled).toBe(false);
    });

    await waitFor(() => {
      expect(setItemMock).toHaveBeenCalledTimes(1);
    });

    expect(JSON.parse(String(setItemMock.mock.calls[0]?.[1]))).toEqual(
      expect.objectContaining({
        weeklyReminderEnabled: false,
      }),
    );
  });
});
