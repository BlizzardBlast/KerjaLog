import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_ONBOARDING_STATE,
  type OnboardingState,
} from '@/features/onboarding/model';
import {
  loadOnboardingState,
  resetOnboardingState,
  saveOnboardingState,
} from '@/features/onboarding/storage';

const COMPLETE_STATE: OnboardingState = {
  version: 1,
  currentStep: 'review-rhythm',
  completed: true,
  workArea: 'technology-product',
  careerLevel: 'junior-contributor',
  mainGoal: 'performance-review',
  reviewSchedule: 'within-3-months',
  weeklyReminderEnabled: true,
  appLockPreferred: true,
};

const getItemMock = jest.mocked(AsyncStorage.getItem);
const setItemMock = jest.mocked(AsyncStorage.setItem);
const removeItemMock = jest.mocked(AsyncStorage.removeItem);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('onboarding storage', () => {
  test('loads a valid completed state', async () => {
    getItemMock.mockResolvedValueOnce(JSON.stringify(COMPLETE_STATE));

    await expect(loadOnboardingState()).resolves.toEqual(COMPLETE_STATE);
  });

  test('downgrades completion when a required answer is missing', async () => {
    getItemMock.mockResolvedValueOnce(
      JSON.stringify({ ...COMPLETE_STATE, reviewSchedule: undefined }),
    );

    const state = await loadOnboardingState();

    expect(state.completed).toBe(false);
    expect(state.reviewSchedule).toBeUndefined();
  });

  test('sanitizes an invalid required enum and clears completion', async () => {
    getItemMock.mockResolvedValueOnce(
      JSON.stringify({ ...COMPLETE_STATE, workArea: 'invalid-work-area' }),
    );

    const state = await loadOnboardingState();

    expect(state.completed).toBe(false);
    expect(state.workArea).toBeUndefined();
    expect(state.careerLevel).toBe(COMPLETE_STATE.careerLevel);
  });

  test('falls back to defaults for an unsupported state version', async () => {
    getItemMock.mockResolvedValueOnce(
      JSON.stringify({ ...COMPLETE_STATE, version: 2 }),
    );

    await expect(loadOnboardingState()).resolves.toEqual(
      DEFAULT_ONBOARDING_STATE,
    );
  });

  test('falls back to defaults for invalid JSON', async () => {
    getItemMock.mockResolvedValueOnce('{invalid-json');

    await expect(loadOnboardingState()).resolves.toEqual(
      DEFAULT_ONBOARDING_STATE,
    );
  });

  test('falls back to defaults when local storage cannot be read', async () => {
    getItemMock.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(loadOnboardingState()).resolves.toEqual(
      DEFAULT_ONBOARDING_STATE,
    );
  });

  test('uses the same storage key for save and reset operations', async () => {
    await saveOnboardingState(COMPLETE_STATE);
    await resetOnboardingState();

    const saveKey = setItemMock.mock.calls[0]?.[0];
    const resetKey = removeItemMock.mock.calls[0]?.[0];

    expect(saveKey).toBeDefined();
    expect(resetKey).toBe(saveKey);
    expect(setItemMock).toHaveBeenCalledWith(
      saveKey,
      JSON.stringify(COMPLETE_STATE),
    );
  });
});
