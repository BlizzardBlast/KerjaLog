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

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isActive = true;

    loadOnboardingState().then((storedState) => {
      if (!isActive) {
        return;
      }

      setState(storedState);
      setIsHydrated(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const snapshot = state;
    writeQueueRef.current = writeQueueRef.current
      .catch(() => undefined)
      .then(() => saveOnboardingState(snapshot));
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

    await writeQueueRef.current.catch(() => undefined);
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
