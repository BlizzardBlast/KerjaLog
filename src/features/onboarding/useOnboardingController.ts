import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { ReminderPrecision } from '@/domain/reminder/model';
import {
  DEFAULT_ONBOARDING_STATE,
  hasRequiredOnboardingAnswers,
  ONBOARDING_STEP_ORDER,
  type OnboardingPatch,
  type OnboardingState,
} from '@/features/onboarding/model';
import {
  loadOnboardingState,
  saveOnboardingState,
} from '@/features/onboarding/storage';
import { useI18n } from '@/i18n/I18nProvider';
import {
  enableWeeklyReflectionNotification,
  getWeeklyReflectionNotificationStatus,
  type WeeklyReflectionEnableResult,
  type WeeklyReflectionNotificationStatus,
} from '@/platform/notifications/weeklyReflection';
import { ignoreError } from '@/shared/utils/function';

export type OnboardingContextValue = {
  state: OnboardingState;
  isHydrated: boolean;
  currentStepIndex: number;
  update: (patch: OnboardingPatch) => void;
  goNext: () => void;
  goBack: () => void;
  complete: () => Promise<void>;
};

export function useOnboardingController(): OnboardingContextValue {
  const { t } = useI18n();
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const skipNextAutosaveRef = useRef(true);

  useEffect(() => {
    let ignore = false;

    const hydrateOnboarding = async () => {
      const storedState = await loadOnboardingState();

      if (ignore) {
        return;
      }

      setState(storedState);
      setIsHydrated(true);
    };

    hydrateOnboarding().catch(ignoreError);

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    const snapshot = state;

    writeQueueRef.current = writeQueueRef.current
      .catch(ignoreError)
      .then(() => saveOnboardingState(snapshot))
      .catch(ignoreError);
  }, [isHydrated, state]);

  useEffect(() => {
    if (!isHydrated || !state.weeklyReminderEnabled) {
      return;
    }

    let ignore = false;
    let isReconciling = false;

    const reconcileReminderState = async () => {
      if (isReconciling) {
        return;
      }

      isReconciling = true;

      try {
        const status = await getWeeklyReflectionNotificationStatus();

        if (ignore || status === 'unsupported-runtime') {
          return;
        }

        if (status === 'disabled') {
          setState((current) =>
            current.weeklyReminderEnabled
              ? {
                  ...current,
                  weeklyReminderEnabled: false,
                  weeklyReminderPrecision: null,
                }
              : current,
          );
          return;
        }

        const observedPrecision = precisionFromStatus(status);
        if (state.weeklyReminderPrecision === observedPrecision) {
          return;
        }

        const result = await enableWeeklyReflectionNotification({
          schedule: state.weeklyReminderSchedule,
          copy: {
            title: t('onboarding.review.notificationTitle'),
            body: t('onboarding.review.notificationBody'),
            channelName: t('onboarding.review.notificationChannelName'),
          },
        });

        if (!ignore) {
          setState((current) => applyReminderResult(current, result));
        }
      } catch {
        if (!ignore) {
          setState((current) => ({
            ...current,
            weeklyReminderEnabled: false,
            weeklyReminderPrecision: null,
          }));
        }
      } finally {
        isReconciling = false;
      }
    };

    reconcileReminderState().catch(ignoreError);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        reconcileReminderState().catch(ignoreError);
      }
    });

    return () => {
      ignore = true;
      subscription.remove();
    };
  }, [
    isHydrated,
    state.weeklyReminderEnabled,
    state.weeklyReminderPrecision,
    state.weeklyReminderSchedule,
    t,
  ]);

  const currentStepIndex = Math.max(
    0,
    ONBOARDING_STEP_ORDER.indexOf(state.currentStep),
  );

  const update = (patch: OnboardingPatch) => {
    setState((current) => ({ ...current, ...patch }));
  };

  const goNext = () => {
    setState((current) => {
      const index = ONBOARDING_STEP_ORDER.indexOf(current.currentStep);
      const nextStep =
        ONBOARDING_STEP_ORDER[
          Math.min(index + 1, ONBOARDING_STEP_ORDER.length - 1)
        ];

      return {
        ...current,
        currentStep: nextStep,
      };
    });
  };

  const goBack = () => {
    setState((current) => {
      const index = ONBOARDING_STEP_ORDER.indexOf(current.currentStep);
      const previousStep = ONBOARDING_STEP_ORDER[Math.max(index - 1, 0)];

      return {
        ...current,
        currentStep: previousStep,
      };
    });
  };

  const complete = async () => {
    if (!hasRequiredOnboardingAnswers(state)) {
      throw new Error('Cannot complete onboarding without required answers.');
    }

    const completedState: OnboardingState = {
      ...state,
      completed: true,
      currentStep: 'review-rhythm',
    };

    await writeQueueRef.current;
    await saveOnboardingState(completedState);

    skipNextAutosaveRef.current = true;
    setState(completedState);
  };

  return {
    state,
    isHydrated,
    currentStepIndex,
    update,
    goNext,
    goBack,
    complete,
  };
}

function precisionFromStatus(
  status: Extract<
    WeeklyReflectionNotificationStatus,
    'enabled-exact' | 'enabled-inexact'
  >,
): ReminderPrecision {
  return status === 'enabled-exact' ? 'exact' : 'inexact';
}

function applyReminderResult(
  state: OnboardingState,
  result: WeeklyReflectionEnableResult,
): OnboardingState {
  if (result === 'enabled-exact' || result === 'enabled-inexact') {
    return {
      ...state,
      weeklyReminderEnabled: true,
      weeklyReminderPrecision: result === 'enabled-exact' ? 'exact' : 'inexact',
    };
  }

  return {
    ...state,
    weeklyReminderEnabled: false,
    weeklyReminderPrecision: null,
  };
}
