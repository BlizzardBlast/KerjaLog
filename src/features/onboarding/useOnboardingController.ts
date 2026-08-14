import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
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
import { getWeeklyReflectionNotificationStatus } from '@/platform/notifications/weeklyReflection';
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

        if (
          ignore ||
          status === 'unsupported-runtime' ||
          status === 'enabled'
        ) {
          return;
        }

        setState((current) =>
          current.weeklyReminderEnabled
            ? { ...current, weeklyReminderEnabled: false }
            : current,
        );
      } catch {
        if (!ignore) {
          setState((current) => ({
            ...current,
            weeklyReminderEnabled: false,
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
  }, [isHydrated, state.weeklyReminderEnabled]);

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
      const nextIndex = Math.min(index + 1, ONBOARDING_STEP_ORDER.length - 1);
      const nextStep = ONBOARDING_STEP_ORDER[nextIndex] ?? current.currentStep;

      return {
        ...current,
        currentStep: nextStep,
      };
    });
  };

  const goBack = () => {
    setState((current) => {
      const index = ONBOARDING_STEP_ORDER.indexOf(current.currentStep);
      const previousIndex = Math.max(index - 1, 0);
      const previousStep =
        ONBOARDING_STEP_ORDER[previousIndex] ?? current.currentStep;

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
