import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from 'react';
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
import { EMPTY_FUNCTION } from '@/shared/utils/function';

export type OnboardingContextValue = {
  state: OnboardingState;
  isHydrated: boolean;
  currentStepIndex: number;
  update: (patch: OnboardingPatch) => void;
  goNext: () => void;
  goBack: () => void;
  complete: () => Promise<void>;
};

export const OnboardingContext = createContext<OnboardingContextValue | null>(
  null,
);

export function OnboardingProvider({ children }: PropsWithChildren) {
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

    hydrateOnboarding().catch(EMPTY_FUNCTION);

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
      .catch(EMPTY_FUNCTION)
      .then(() => saveOnboardingState(snapshot))
      .catch(EMPTY_FUNCTION);
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

        if (!ignore && status === 'disabled') {
          setState((current) =>
            current.weeklyReminderEnabled
              ? { ...current, weeklyReminderEnabled: false }
              : current,
          );
        }
      } finally {
        isReconciling = false;
      }
    };

    reconcileReminderState().catch(EMPTY_FUNCTION);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        reconcileReminderState().catch(EMPTY_FUNCTION);
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

  const value: OnboardingContextValue = {
    state,
    isHydrated,
    currentStepIndex,
    update,
    goNext,
    goBack,
    complete,
  };

  return <OnboardingContext value={value}>{children}</OnboardingContext>;
}
