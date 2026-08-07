import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  careerLevelOptions,
  DEFAULT_ONBOARDING_STATE,
  goalOptions,
  ONBOARDING_STEP_ORDER,
  type OnboardingState,
  type OnboardingStepId,
  reviewScheduleOptions,
  workAreaOptions,
} from '@/features/onboarding/model';

const ONBOARDING_STORAGE_KEY = '@kerjalog/onboarding/v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasValue<T extends string>(
  options: ReadonlyArray<{ value: T }>,
  value: unknown,
): value is T {
  return typeof value === 'string' && options.some((option) => option.value === value);
}

function isStep(value: unknown): value is OnboardingStepId {
  return (
    typeof value === 'string' &&
    ONBOARDING_STEP_ORDER.includes(value as OnboardingStepId)
  );
}

function sanitizeOnboardingState(value: unknown): OnboardingState {
  if (!isRecord(value) || value.version !== 1) {
    return DEFAULT_ONBOARDING_STATE;
  }

  return {
    version: 1,
    currentStep: isStep(value.currentStep)
      ? value.currentStep
      : DEFAULT_ONBOARDING_STATE.currentStep,
    completed:
      typeof value.completed === 'boolean'
        ? value.completed
        : DEFAULT_ONBOARDING_STATE.completed,
    workArea: hasValue(workAreaOptions, value.workArea)
      ? value.workArea
      : undefined,
    careerLevel: hasValue(careerLevelOptions, value.careerLevel)
      ? value.careerLevel
      : undefined,
    mainGoal: hasValue(goalOptions, value.mainGoal) ? value.mainGoal : undefined,
    reviewSchedule: hasValue(reviewScheduleOptions, value.reviewSchedule)
      ? value.reviewSchedule
      : undefined,
    weeklyReminderEnabled:
      typeof value.weeklyReminderEnabled === 'boolean'
        ? value.weeklyReminderEnabled
        : DEFAULT_ONBOARDING_STATE.weeklyReminderEnabled,
    appLockPreferred:
      typeof value.appLockPreferred === 'boolean'
        ? value.appLockPreferred
        : DEFAULT_ONBOARDING_STATE.appLockPreferred,
  };
}

export async function loadOnboardingState(): Promise<OnboardingState> {
  try {
    const storedValue = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

    if (!storedValue) {
      return DEFAULT_ONBOARDING_STATE;
    }

    return sanitizeOnboardingState(JSON.parse(storedValue) as unknown);
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }
}

export async function saveOnboardingState(state: OnboardingState): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
}

export async function resetOnboardingState(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
}
