import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_ONBOARDING_STATE,
  ONBOARDING_STEP_ORDER,
  type OnboardingState,
} from '@/features/onboarding/model';
import {
  loadOnboardingState,
  saveOnboardingState,
} from '@/features/onboarding/storage';
import { EMPTY_FUNCTION } from '@/shared/utils/function';

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

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

    const snapshot = state;
    const previousWrite = writeQueueRef.current;

    writeQueueRef.current = (async () => {
      try {
        await previousWrite;
      } catch {
        // A failed earlier write must not permanently block later snapshots.
      }

      await saveOnboardingState(snapshot);
    })();
  }, [isHydrated, state]);

  const currentStepIndex = useMemo(
    () => Math.max(0, ONBOARDING_STEP_ORDER.indexOf(state.currentStep)),
    [state.currentStep],
  );

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState((current) => ({ ...current, ...patch, version: 1 }));
  }, []);

  const goNext = useCallback(() => {
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
  }, []);

  const goBack = useCallback(() => {
    setState((current) => {
      const index = ONBOARDING_STEP_ORDER.indexOf(current.currentStep);
      const previousStep = ONBOARDING_STEP_ORDER[Math.max(index - 1, 0)];

      return {
        ...current,
        currentStep: previousStep,
      };
    });
  }, []);

  const complete = useCallback(async () => {
    const completedState: OnboardingState = {
      ...state,
      completed: true,
      currentStep: 'review-rhythm',
    };

    try {
      await writeQueueRef.current;
    } catch {
      // The final explicit write below is authoritative for completion.
    }

    await saveOnboardingState(completedState);
    setState(completedState);
  }, [state]);

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
