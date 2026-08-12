import AsyncStorage from '@react-native-async-storage/async-storage';
import { isReminderPrecision } from '@/domain/reminder/model';
import {
  CAREER_LEVELS,
  DEFAULT_ONBOARDING_STATE,
  DEFAULT_WEEKLY_REMINDER_SCHEDULE,
  hasRequiredOnboardingAnswers,
  isValidWeeklyReminderSchedule,
  MAIN_GOALS,
  ONBOARDING_STATE_VERSION,
  ONBOARDING_STEP_ORDER,
  type OnboardingState,
  type OnboardingStepId,
  REVIEW_SCHEDULES,
  WORK_AREAS,
} from '@/features/onboarding/model';

const ONBOARDING_STORAGE_KEY = '@kerjalog/onboarding/v1';

/**
 * AsyncStorage is intentionally limited to coarse setup preferences and wizard
 * progress. Never add free-form work content, employer identifiers, salary,
 * feedback, project names, evidence, attachments, or generated career text to
 * this state. Those belong behind KerjaLog's encrypted SQLite persistence
 * boundary.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasValue<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function isStep(value: unknown): value is OnboardingStepId {
  return hasValue(ONBOARDING_STEP_ORDER, value);
}

function sanitizeOnboardingState(value: unknown): OnboardingState {
  if (!isRecord(value) || value.version !== ONBOARDING_STATE_VERSION) {
    return DEFAULT_ONBOARDING_STATE;
  }

  const weeklyReminderEnabled =
    typeof value.weeklyReminderEnabled === 'boolean'
      ? value.weeklyReminderEnabled
      : DEFAULT_ONBOARDING_STATE.weeklyReminderEnabled;
  const sanitizedState: OnboardingState = {
    version: ONBOARDING_STATE_VERSION,
    currentStep: isStep(value.currentStep)
      ? value.currentStep
      : DEFAULT_ONBOARDING_STATE.currentStep,
    completed: false,
    workArea: hasValue(WORK_AREAS, value.workArea) ? value.workArea : undefined,
    careerLevel: hasValue(CAREER_LEVELS, value.careerLevel)
      ? value.careerLevel
      : undefined,
    mainGoal: hasValue(MAIN_GOALS, value.mainGoal) ? value.mainGoal : undefined,
    reviewSchedule: hasValue(REVIEW_SCHEDULES, value.reviewSchedule)
      ? value.reviewSchedule
      : undefined,
    weeklyReminderEnabled,
    weeklyReminderSchedule: isValidWeeklyReminderSchedule(
      value.weeklyReminderSchedule,
    )
      ? value.weeklyReminderSchedule
      : DEFAULT_WEEKLY_REMINDER_SCHEDULE,
    weeklyReminderPrecision:
      weeklyReminderEnabled &&
      isReminderPrecision(value.weeklyReminderPrecision)
        ? value.weeklyReminderPrecision
        : null,
  };

  return {
    ...sanitizedState,
    completed:
      value.completed === true && hasRequiredOnboardingAnswers(sanitizedState),
  };
}

export async function loadOnboardingState(): Promise<OnboardingState> {
  try {
    const storedValue = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

    if (!storedValue) {
      return DEFAULT_ONBOARDING_STATE;
    }

    return sanitizeOnboardingState(JSON.parse(storedValue));
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }
}

export async function saveOnboardingState(
  state: OnboardingState,
): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
}

export async function resetOnboardingState(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
}
