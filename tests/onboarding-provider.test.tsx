import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { OnboardingProvider } from '@/features/onboarding/OnboardingProvider';
import { useOnboarding } from '@/features/onboarding/useOnboarding';

const getItemMock = jest.mocked(AsyncStorage.getItem);
const setItemMock = jest.mocked(AsyncStorage.setItem);

function wrapper({ children }: PropsWithChildren) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
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
});
